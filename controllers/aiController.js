const OpenAI = require("openai");
const Product = require("../model/Product");
const Category = require("../model/Category");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
    "X-Title": "AvoCart",
  },
});

// Resilient model fallback list for OpenRouter free tier (prioritizing lesson model)
const MODEL_CANDIDATES = [
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "google/gemma-3-27b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openrouter/free",
];

// Store policies reference
const storePolicies = [
  {
    policy:
      "We offer a 10-day return policy for most items. Items must be in original condition with tags intact.",
    source: "Returns & Refunds Policy",
    tags: ["return", "refund", "exchange", "back", "10 days", "warranty", "replace"],
  },
  {
    policy:
      "Standard shipping is completely free on all orders. Delivery typically takes 3-5 business days.",
    source: "Shipping & Delivery Policy",
    tags: ["shipping", "delivery", "free shipping", "time", "days", "cost", "charge"],
  },
  {
    policy:
      "Orders can be tracked from your Profile -> Order History section or using the link sent to your registered email.",
    source: "Order Tracking",
    tags: ["track", "status", "where is my order", "tracking", "history", "order"],
  },
];

const STOP_WORDS = new Set([
  "what",
  "which",
  "where",
  "when",
  "have",
  "does",
  "show",
  "tell",
  "give",
  "find",
  "some",
  "with",
  "from",
  "that",
  "this",
  "your",
  "about",
  "please",
  "want",
  "need",
  "looking",
  "items",
  "item",
  "products",
  "product",
  "avocart",
  "store",
]);

/**
 * Dynamically queries real MongoDB products and categories to assemble RAG context
 */
async function retrieveDatabaseKnowledgeBase(query) {
  const q = query.toLowerCase().trim();
  const keywords = q
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  let contextSegments = [];
  let categories = [];
  let products = [];
  let matchingProducts = [];

  // 1. Check Store Policies
  const matchedPolicies = storePolicies.filter((item) =>
    item.tags.some((tag) => q.includes(tag))
  );

  if (matchedPolicies.length > 0) {
    matchedPolicies.forEach((p) => {
      contextSegments.push(`[Policy Info] ${p.source}: ${p.policy}`);
    });
  }

  try {
    // 2. Fetch real database categories and products
    [categories, products] = await Promise.all([
      Category.find({}).lean(),
      Product.find({}).populate("category").lean(),
    ]);

    if (categories && categories.length > 0) {
      const catNames = categories.map((c) => c.name).join(", ");
      contextSegments.push(`[Available Categories in Store] ${catNames}`);
    }

    if (products && products.length > 0) {
      matchingProducts = products.filter((p) => {
        const title = (p.title || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const cat = (p.category?.name || "").toLowerCase();
        const subCat = (p.subCategory || "").toLowerCase();

        if (title.includes(q) || desc.includes(q) || cat.includes(q) || subCat.includes(q)) {
          return true;
        }

        if (keywords.length > 0) {
          return keywords.some(
            (kw) =>
              title.includes(kw) ||
              desc.includes(kw) ||
              cat.includes(kw) ||
              subCat.includes(kw)
          );
        }
        return false;
      });

      const itemsToInclude =
        matchingProducts.length > 0 ? matchingProducts : products.slice(0, 10);

      const productDescriptions = itemsToInclude.map((p) => {
        const catName = p.category?.name || "General";
        const priceStr = `₹${p.price}`;
        const discountStr = p.discount ? ` (${p.discount}% OFF)` : "";
        const ratingStr = p.rating ? ` Rating: ${p.rating}/5★` : "";
        const stockStr =
          p.countInStock > 0 ? `In Stock (${p.countInStock} left)` : "Available";

        return `- Product: "${p.title}" | Category: ${catName} | Price: ${priceStr}${discountStr} | ${ratingStr} | Status: ${stockStr}${
          p.description ? ` | Description: ${p.description}` : ""
        }`;
      });

      contextSegments.push(
        `[Real Database Products (${
          matchingProducts.length > 0 ? "Query Matches" : "Featured Catalog"
        })]\n` + productDescriptions.join("\n")
      );
    } else {
      contextSegments.push(
        "[Database Catalog] No active products found in the database catalog currently."
      );
    }
  } catch (dbErr) {
    console.error(
      "⚠️ [RAG DB ERROR] Failed to fetch database products:",
      dbErr.message
    );
    contextSegments.push(
      "[Database Status] Catalog currently initializing. Please try again shortly."
    );
  }

  return {
    contextText: contextSegments.join("\n\n"),
    dbData: {
      matchedPolicies,
      categories,
      matchingProducts,
      allProducts: products,
    },
  };
}

// Clean up meta prefixes or safety-classifier tags like "user safe" or "safely safe"
function sanitizeAIReply(replyText) {
  if (!replyText || typeof replyText !== "string") return "";
  return replyText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(
      /^(user\s+safe|safely\s+safe|safely|safe|unsafe|as an ai|here is your response|here is the information)[\s:,.-]*/gi,
      ""
    )
    .trim();
}

// Detect if a model output is just a safety classifier label (e.g., Llama Guard outputting "user safe" or "safe")
function isSafetyClassifierOrInvalid(rawText, cleanedText) {
  if (!cleanedText || cleanedText.length < 4) return true;
  const normalizedRaw = (rawText || "").trim().toLowerCase();
  const normalizedClean = cleanedText.trim().toLowerCase();
  if (
    /^(user\s*)?(safe|unsafe)(\s*s\d+)?[\.\!]*$/i.test(normalizedRaw) ||
    /^(user\s*)?(safe|unsafe)(\s*s\d+)?[\.\!]*$/i.test(normalizedClean)
  ) {
    return true;
  }
  return false;
}

/**
 * Deterministic RAG fallback responder grounded in real MongoDB products & policies
 * Used when external free LLM models rate-limit or return moderation tokens.
 */
function buildSmartRAGFallbackReply(query, dbData) {
  const q = (query || "").toLowerCase().trim();
  const {
    matchedPolicies = [],
    categories = [],
    matchingProducts = [],
    allProducts = [],
  } = dbData || {};

  const catNames =
    categories.length > 0
      ? categories.map((c) => c.name).join(", ")
      : "Men, Women, Kids, Home, Electronics";

  // 1. Greeting or general help
  if (
    /^(hi|hello|hey|hii|hola|namaste|good\s*(morning|afternoon|evening)|help|who are you|what can you do)\b/i.test(
      q
    )
  ) {
    return `Hello! 👋 Welcome to **AvoCart**! I can help you explore our catalog across **${catNames}**, check product prices & ratings, or answer questions about shipping and returns.\n\nTry asking me:\n- **Show me men jackets or women dresses**\n- **Best rated electronics**\n- **Products under ₹1500**\n- **What is your return & shipping policy?**`;
  }

  // 2. Store policies match (when user asks specifically about return/shipping/order tracking)
  if (matchedPolicies.length > 0 && matchingProducts.length === 0) {
    const policyLines = matchedPolicies.map(
      (p) => `- **${p.source}:** ${p.policy}`
    );
    return `Here is our store policy information:\n\n${policyLines.join("\n")}`;
  }

  // 3. Price-based query (e.g. "under 2000", "below 1500", "cheap", "budget")
  const priceMatch = q.match(/(?:under|below|less than|within|max)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (priceMatch && allProducts.length > 0) {
    const maxPrice = Number(priceMatch[1]);
    const budgetItems = (matchingProducts.length > 0 ? matchingProducts : allProducts)
      .filter((p) => Number(p.price) <= maxPrice)
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    if (budgetItems.length > 0) {
      const list = budgetItems.map(
        (p) =>
          `- **${p.title}** (${p.category?.name || "Catalog"}) — **₹${p.price}**${
            p.discount ? ` (${p.discount}% OFF)` : ""
          } • ${p.rating || 4.5}★`
      );
      return `Here are top products in our catalog under **₹${maxPrice}**:\n\n${list.join(
        "\n"
      )}`;
    }
  }

  // 4. Matching products from query
  if (matchingProducts.length > 0) {
    const topMatches = matchingProducts.slice(0, 5).map(
      (p) =>
        `- **${p.title}** (${p.category?.name || "General"}) — **₹${p.price}**${
          p.discount ? ` (${p.discount}% OFF)` : ""
        } • Rating: **${p.rating || 4.5}/5★**`
    );
    return `Here are the matching products from our **AvoCart** catalog:\n\n${topMatches.join(
      "\n"
    )}\n\nYou can search or filter these directly on the **Products** page!`;
  }

  // 5. Top-rated / Trending / General recommendation fallback
  if (allProducts.length > 0) {
    const featured = [...allProducts]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
      .map(
        (p) =>
          `- **${p.title}** (${p.category?.name || "General"}) — **₹${p.price}** • **${
            p.rating || 4.5
          }/5★**`
      );

    return `We offer curated collections across **${catNames}**. Here are some of our top-rated products right now:\n\n${featured.join(
      "\n"
    )}\n\nStandard shipping is **FREE** on all orders with a **10-day return policy**. Let me know if you're looking for a specific category or price range!`;
  }

  return `Welcome to **AvoCart**! We offer fashion & lifestyle products across **${catNames}** with **free standard shipping** (3–5 business days) and a **10-day return policy**. How can I help you shop today?`;
}

// --- Controller Handler ---
exports.handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Valid message string is required" });
    }

    const cleanMessage = message.trim();
    console.log(
      `\n🔍 [RAG DB SEARCH] Fetching real database context for: "${cleanMessage}"`
    );
    const { contextText, dbData } =
      await retrieveDatabaseKnowledgeBase(cleanMessage);

    const SYSTEM_PROMPT = `
You are a helpful and friendly AI shopping assistant for the AvoCart e-commerce store.
Your role is to answer user questions using ONLY the provided real database catalog and store policy context below.

Real Database Knowledge Base Context:
${contextText}

Rules:
1. Answer politely and concisely based strictly on the provided database context.
2. When answering product questions, cite real product titles, categories, prices in ₹, ratings, and stock status from the context.
3. Do NOT output safety disclaimers, intro meta-talk (like "user safe", "safely safe", "As an AI", "Here is your response"), or system headers.
4. If asked about a product or policy not present in the context, politely state that it's not in our store catalog and recommend checking our categories (${
      dbData.categories?.map((c) => c.name).join(", ") ||
      "Men, Women, Kids, Home, Electronics"
    }).
5. Keep answers clean, accurate, and direct. Do NOT invent fake products, prices, or store policies outside the context.
    `;

    let reply = null;

    if (process.env.OPENROUTER_API_KEY) {
      for (const modelName of MODEL_CANDIDATES) {
        try {
          console.log(`🤖 [AI CALL] Attempting model: ${modelName}...`);
          const aiResp = await client.chat.completions.create({
            model: modelName,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: cleanMessage },
            ],
            max_tokens: 350,
            temperature: 0.5,
          });

          const rawContent = aiResp.choices?.[0]?.message?.content;
          if (rawContent && rawContent.trim()) {
            const candidateReply = sanitizeAIReply(rawContent);
            if (!isSafetyClassifierOrInvalid(rawContent, candidateReply)) {
              reply = candidateReply;
              console.log(`💬 [AI REPLY SUCCESS (${modelName})]\n${reply}\n`);
              break;
            } else {
              console.warn(
                `⚠️ [AI MODEL SKIPPED (${modelName})]: Returned classifier/invalid token "${rawContent.trim()}"`
              );
            }
          }
        } catch (err) {
          console.warn(
            `⚠️ [AI MODEL FAIL (${modelName})]:`,
            err.response?.data?.error?.message || err.message
          );
        }
      }
    }

    // Fallback to deterministic RAG response if external free models rate-limit or return safety labels
    if (!reply) {
      reply = buildSmartRAGFallbackReply(cleanMessage, dbData);
      console.log(`💬 [RAG DIRECT FALLBACK REPLY]\n${reply}\n`);
    }

    return res.json({
      success: true,
      reply,
    });
  } catch (err) {
    console.error("❌ AI Controller Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message:
        "Unable to generate AI response right now. Please try again in a moment.",
    });
  }
};

const OpenAI = require("openai");
const Product = require("../model/Product");
const Category = require("../model/Category");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
    "X-Title": "AvoCart"
  }
});

// Resilient model fallback list for OpenRouter free tier
const MODEL_CANDIDATES = [
  "openrouter/free",
  "nvidia/nemotron-3.5-lightning:free",
  "openrouter/auto"
];

// Store policies reference
const storePolicies = [
  {
    policy: "We offer a 10-day return policy for most items. Items must be in original condition with tags intact.",
    source: "Returns & Refunds Policy",
    tags: ["return", "refund", "exchange", "back", "10 days", "warranty"]
  },
  {
    policy: "Standard shipping is completely free on all orders. Delivery typically takes 3-5 business days.",
    source: "Shipping & Delivery Policy",
    tags: ["shipping", "delivery", "free shipping", "time", "days", "cost"]
  },
  {
    policy: "Orders can be tracked from your Profile -> Order History section or using the link sent to your registered email.",
    source: "Order Tracking",
    tags: ["track", "status", "where is my order", "tracking", "history"]
  }
];

/**
 * Dynamically queries real MongoDB products and categories to assemble RAG context
 */
async function retrieveDatabaseKnowledgeBase(query) {
  const q = query.toLowerCase();
  let contextSegments = [];

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
    const [categories, products] = await Promise.all([
      Category.find({}).lean(),
      Product.find({}).populate("category").lean(),
    ]);

    if (categories && categories.length > 0) {
      const catNames = categories.map((c) => c.name).join(", ");
      contextSegments.push(`[Available Categories in Store] ${catNames}`);
    }

    if (products && products.length > 0) {
      const matchingProducts = products.filter((p) => {
        const titleMatch = p.title?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const catMatch = p.category?.name?.toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch;
      });

      const itemsToInclude = matchingProducts.length > 0 ? matchingProducts : products.slice(0, 8);

      const productDescriptions = itemsToInclude.map((p) => {
        const catName = p.category?.name || "General";
        const priceStr = `₹${p.price}`;
        const discountStr = p.discount ? ` (${p.discount}% OFF)` : "";
        const ratingStr = p.rating ? ` Rating: ${p.rating}/5★` : "";
        const stockStr = p.countInStock > 0 ? `In Stock (${p.countInStock} left)` : "Available";

        return `- Product: "${p.title}" | Category: ${catName} | Price: ${priceStr}${discountStr} | ${ratingStr} | Status: ${stockStr}${
          p.description ? ` | Description: ${p.description}` : ""
        }`;
      });

      contextSegments.push(
        `[Real Database Products (${matchingProducts.length > 0 ? "Query Matches" : "Featured Catalog"})]\n` +
          productDescriptions.join("\n")
      );
    } else {
      contextSegments.push("[Database Catalog] No active products found in the database catalog currently.");
    }
  } catch (dbErr) {
    console.error("⚠️ [RAG DB ERROR] Failed to fetch database products:", dbErr.message);
    contextSegments.push("[Database Status] Catalog currently initializing. Please try again shortly.");
  }

  return contextSegments.join("\n\n");
}

// Clean up meta prefixes like "safely safe" or system disclaimers
function sanitizeAIReply(replyText) {
  if (!replyText) return "";
  return replyText
    .replace(/^(safely safe|safely|as an ai|here is your response|here is the information)[\s\:\,\.\-]*/gi, "")
    .trim();
}

// --- Controller Handler ---
exports.handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Valid message string is required" });
    }

    console.log(`\n🔍 [RAG DB SEARCH] Fetching real database context for: "${message}"`);
    const retrievedContext = await retrieveDatabaseKnowledgeBase(message.trim());

    const SYSTEM_PROMPT = `
You are a helpful and friendly AI shopping assistant for the AvoCart e-commerce store.
Your role is to answer user questions using ONLY the provided real database catalog and store policy context below.

Real Database Knowledge Base Context:
${retrievedContext}

Rules:
1. Answer politely and concisely based strictly on the provided database context.
2. When answering product questions, cite real product titles, categories, prices in ₹, ratings, and stock status from the context.
3. Do NOT output safety disclaimers, intro meta-talk (like "safely safe", "As an AI", "Here is your response"), or system headers.
4. If asked about a product or policy not present in the context, politely state that it's not in our store catalog and recommend checking our categories or contacting support.
5. Keep answers clean, accurate, and direct. Do NOT invent fake products, prices, or store policies outside the context.
    `;

    let reply = null;
    let lastError = null;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        console.log(`🤖 [AI CALL] Attempting model: ${modelName}...`);
        const aiResp = await client.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message.trim() }
          ],
          max_tokens: 350,
          temperature: 0.7
        });

        const rawContent = aiResp.choices?.[0]?.message?.content;
        if (rawContent && rawContent.trim()) {
          reply = sanitizeAIReply(rawContent);
          console.log(`💬 [AI REPLY SUCCESS (${modelName})]\n${reply}\n`);
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ [AI MODEL FAIL (${modelName})]:`, err.response?.data?.error?.message || err.message);
      }
    }

    if (!reply) {
      throw lastError || new Error("All AI model endpoints failed to generate a response");
    }

    return res.json({
      success: true,
      reply
    });

  } catch (err) {
    console.error("❌ AI Controller Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Unable to generate AI response right now. Please try again in a moment."
    });
  }
};

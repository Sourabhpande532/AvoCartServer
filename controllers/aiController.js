const OpenAI = require("openai");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";

// --- RAG Knowledge Base ---
const storePoliciesKB = [
  {
    policy: "We offer a 10-day return policy for most items. Items must be in original condition.",
    source: "Returns & Refunds Policy",
    tags: ["return", "refund", "exchange", "back", "10 days", "warranty"]
  },
  {
    policy: "Shipping is completely free on all orders. Standard delivery takes 3-5 business days.",
    source: "Shipping Information",
    tags: ["shipping", "delivery", "free shipping", "time", "days", "cost"]
  },
  {
    policy: "You can track your order using the tracking link sent to your email or by visiting the 'My Orders' section.",
    source: "Order Tracking",
    tags: ["track", "status", "where is my order", "tracking"]
  }
];

// Simple Matcher Function (RAG)
function findPolicy(query) {
  const q = query.toLowerCase();
  for (const item of storePoliciesKB) {
    for (const tag of item.tags) {
      if (q.includes(tag.toLowerCase())) {
        return `Answer found in knowledge base: ${item.policy} (Source: ${item.source})`;
      }
    }
  }
  return "I don't know the policy for that. Please check with customer support.";
}

// --- Controller Logic ---
exports.handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    console.log(`\n🔍 [RAG MATCHER] Searching knowledge base for: "${message}"`);
    
    // Step 1: Retrieve context from RAG
    const retrievedContext = findPolicy(message);
    console.log(`✅ [RAG RESULT] Context retrieved: ${retrievedContext}`);

    // Step 2: Inject into System Prompt
    const SYSTEM_PROMPT = `
You are a helpful and friendly AI shopping assistant for our e-commerce app.
Your role is to answer user questions using ONLY the provided Knowledge Base context below.

Knowledge Base Context:
${retrievedContext}

Rules:
1. If the Knowledge Base Context contains the answer, formulate a polite and friendly response based on it.
2. If the Knowledge Base Context says "I don't know", respond politely that you do not have that information and they should contact support.
3. Do NOT make up any information outside of the provided context.
4. Keep answers simple. Do NOT use markdown.
    `;

    console.log("\n🤖 [AI CALL] Sending Prompt to AI...");

    // Step 3: Call AI
    const aiResp = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      max_tokens: 350,
      temperature: 0.8
    });

    const reply = aiResp.choices?.[0]?.message?.content || "No response from AI";
    console.log(`💬 [AI REPLY] ${reply}`);

    res.json({
      success: true,
      reply
    });

  } catch (err) {
    console.error("AI Controller Error:", err.response?.data || err.message);
    res.status(500).json({
      message: err.response?.data || err.message || "Internal server error"
    });
  }
};

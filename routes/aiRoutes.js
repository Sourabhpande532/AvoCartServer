const axios = require("axios");
const express = require("express");
const app = express.Router();

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const response = await axios.post(
      API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `
You are a helpful assistant for an ecommerce app.
Do NOT use markdown. Keep answers simple.
            `,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    // console.log(JSON.stringify(response.data, null, 2));
    if (!response.data?.choices?.length) {
      return res.status(500).json({
        message: "Invalid AI response",
        raw: response.data,
      });
    }

    const reply = response.data.choices[0].message?.content || "No response";

    res.json({
      success: true,
      reply,
    });
  } catch (err) {
    console.log(err.response?.data || err.message);

    res.status(500).json({
      message: err.response?.data || err.message,
    });
  }
});

module.exports = app;

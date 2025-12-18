const express = require("express");
const app = express.Router();

const Category = require("../model/Category");

app.post("/", async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.json({
      suceess: true,
      message: "Category created successfully",
      data: { category },
    });
  } catch (error) {
    console.error("Error creating category:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
});

app.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({
      success: true,
      message: "Category created successfully",
      data: { categories },
      meta: {
        timestamp: new Date(),
        requestId: "REQ-" + Date.now(),
      },
      collection: [
        {
          name: "Summer collection",
          description: "lorem text out best winter xl texhe dfh",
          img: "https://placehold.co/100",
        },
        {
          name: "Summer collection",
          description: "lorem text out best winter xl texhe df",
          img: "https://placehold.co/150",
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

app.get("/:categoryId", async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json({
      data: { category },
      message: "Category fetched successfully",
      success: true,
      meta: {
        requestId: "REQ-" + Date.now(),
        apiVersion: "1.1",
        timestamp: new Date(),
      },
      user: {
        id: "123",
        role: "admin",
        permissions: ["create", "update"],
      },
    });
  } catch (error) {
    console.error("Error fetching category:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
});

module.exports = app;
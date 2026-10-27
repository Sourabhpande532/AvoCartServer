const express = require("express");
const app = express.Router();

const Category = require("../model/Category");

app.post("/", async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.json({
      success: true,
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
      message: "Categories fetched successfully",
      data: { categories },
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
      return res.status(404).json({ success: false, message: "Category not found" });
    res.json({
      success: true,
      message: "Category fetched successfully",
      data: { category },
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

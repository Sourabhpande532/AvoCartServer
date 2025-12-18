const express = require("express");
const app = express.Router();
const Product = require("../model/Product");

app.post("/", async (req, res) => {
  try {
    const productGenerate = await Product.create(req.body);
    res.status(200).json({
      success: true,
      message: "Product created successfully",
      data: { product: productGenerate },
    });
  } catch (error) {
    console.error("Error creating product:", error.message);
    res.status(500).json({
      suceess: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
});
// GET PRODUCT BY ID
app.get("/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate(
      "category"
    );
    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    res.json({
      success: true,
      message: "Product fetched successfully",
      data: { product },
    });
  } catch (error) {
    console.error("Error fetching product:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: err.message,
    });
  }
});

// GET ALL PRODUCT WITH QUERY SUPOORT
app.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.search)
      query.title = { $regex: req.query.search, $options: "i" };
    const products = await Product.find(query).populate("category");
    res.json({
      success: true,
      message: "Product Fetched successfully",
      data: { products },
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// ADD FIELDS TO ALL PRODUCTS
app.put("/add_fields", async (req, res) => {
  try {
    const result = await Product.updateMany(
      {},
      {
        $set: {
          discount: 25,
          deliveryCharge: 199,
        },
      }
    );
    res.json({
      success: true,
      message: "All products update successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating all products:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update products",
      error: error.message,
    });
  }
});

module.exports = app;
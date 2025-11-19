const { initializeDatabase } = require("./db/db.connect");
const express = require("express");
const app = express();
const cors = require("cors");
initializeDatabase();

const corsOption = {
  origin: "*",
  credential: true,
  optionSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOption));

// PRODUCT
const Product = require("./model/Product.js");

// CREATE PRODUCT
app.post("/api/products", async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(200).json({
      success: true,
      message: "Product created successfully",
      data: { product: p },
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
app.get("/api/products/:productId", async (req, res) => {
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
app.get("/api/products", async (req, res) => {
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
app.put("/api/products/add-fields", async (req, res) => {
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
      success:true,
      message: "All products update successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating all products:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update products",
      error: error.message
    });
  }
});

const Category = require("./model/Category.js");
app.post("/api/categories", async (req, res) => {
  try {
    const c = await Category.create(req.body);
    res.json({ data: { category: c } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/categories", async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ success: false, server: err.message });
  }
});

app.get("/api/categories/:categoryId", async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CART ITEM
const CartItem = require("./model/CartItem.js");

app.get("/api/cart", async (req, res) => {
  const userId = req.query.userId || "default";
  const items = await CartItem.find({ userId }).populate("product");
  res.json({ success: true, data: { cart: items } });
});

// CREATING
app.post("/api/cart", async (req, res) => {
  const { userId = "default", productId, qty = 1, size = "" } = req.body;

  let item = await CartItem.findOne({
    userId,
    product: productId,
    size: size,
  });
  if (item) {
    item.qty += Number(qty);
    await item.save();
  } else {
    item = await CartItem.create({
      userId,
      product: productId,
      qty: Number(qty),
      size,
    });
  }

  const items = await CartItem.find({ userId }).populate("product");
  res.json({
    success: true,
    message: "Item added to cart",
    data: { cart: items },
  });
});

// UPADATE
app.put("/api/cart/:id", async (req, res) => {
  const { qty } = req.body;
  const item = await CartItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  item.qty = qty;
  await item.save();
  res.json({ data: { item } });
});

// UPADATE EXISTING
app.put("/api/cartitem/add", async (req, res) => {
  try {
    const result = await CartItem.updateMany(
      {}, //empty filter = select all product
      {
        $set: {
          size: "XL",
          sizes: ["S", "M", "XXL", "XL"],
        },
      }
    );
    res.json({
      message: "All cart update successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// DELETE
app.delete("/api/cart/:id", async (req, res) => {
  try {
    const cartItem = await CartItem.findByIdAndDelete(req.params.id);
    if (!cartItem) return res.status(404).json({ message: "item not found" });
    res.json({ message: "Deleted", cart: cartItem });
  } catch (error) {
    console.error("cannot delte via id", error.message);
    res
      .status(500)
      .json({ success: false, message: "Internal Error", err: error.message });
  }
});

// WISHLIST
const WishlistItem = require("./model/WishlistItem.js");

app.get("/api/wishlist", async (req, res) => {
  const userId = req.query.userId || "default";
  const items = await WishlistItem.find({ userId }).populate("product");
  res.json({ data: { wishlist: items } });
});

app.post("/api/wishlist", async (req, res) => {
  //NOTE: renaming here product: productId
  const { userId = "default", productId } = req.body;
  // This checks if the product is already in the user’s wishlist
  const exists = await WishlistItem.findOne({ userId, product: productId });
  if (exists) {
    const items = await WishlistItem.find({ userId }).populate("product");
    return res.json({ data: { wishlist: items } });
  }
  // If the product doesn’t exist already, this line adds it add new wishlist item.
  await WishlistItem.create({ userId, product: productId });
  // After adding, it fetches the new full wishlist again — now including the newly added product.
  const items = await WishlistItem.find({ userId }).populate("product");
  res.json({ data: { wishlist: items } });
});

// DELETED
app.delete("/api/wishlist/:id", async (req, res) => {
  await WishlistItem.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ADDRESS
const Address = require("./model/Address.js");
app.get("/api/addresses", async (req, res) => {
  const userId = req.query.userId || "default";
  const addresses = await Address.find({ userId });
  res.json({ data: { addresses } });
});

// CREATE
app.post("/api/addresses", async (req, res) => {
  const { userId = "default" } = req.body;
  const addr = await Address.create({ ...req.body, userId });
  const addresses = await Address.find({ userId });
  res.json({ data: { addresses } });
});

// UPADATE
app.put("/api/addresses/:id", async (req, res) => {
  const addr = await Address.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json({ data: { address: addr } });
});

// DELETE
app.delete("/api/addresses/:id", async (req, res) => {
  await Address.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ORDERED
const Order = require("./model/Order.js");

app.get("/api/orders", async (req, res) => {
  const userId = req.query.userId || "default";
  const orders = await Order.find({ userId }).populate("items.product");
  res.json({ data: { orders } });
});

app.post("/api/orders", async (req, res) => {
  const { userId = "default", items, total, address } = req.body;
  const order = await Order.create({ userId, items, total, address });
  // clear cart for this user
  await CartItem.deleteMany({ userId });
  res.json({ data: { order } });
});

app.delete("/api/orders/:id", async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

app.get("/", (req, res) => {
  res.send("Hello, Welcome to express routes.");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});

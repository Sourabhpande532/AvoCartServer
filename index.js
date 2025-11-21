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
app.put("/api/products/add_fields", async (req, res) => {
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

const Category = require("./model/Category.js");
app.post("/api/categories", async (req, res) => {
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
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
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
  } catch (error) {
    console.error("Error fetching category:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
});

// CART ITEM
const CartItem = require("./model/CartItem.js");
// GET CART ITEMS FOR USER
app.get("/api/cart", async (req, res) => {
  try {
    const userId = req.query.userId || "default";
    const items = await CartItem.find({ userId }).populate("product");

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: { cart: items },
    });
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
});

// ADD ITEM TO CART
app.post("/api/cart", async (req, res) => {
  try {
    const { userId = "default", productId, qty = 1, size = "" } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }
    let item = await CartItem.findOne({
      userId,
      product: productId,
      size,
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
    return res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: { cart: items },
    });
  } catch (error) {
    console.error("Error adding item to cart:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
});

// UPDATE CART ITEM QTY
app.put("/api/cart/:id", async (req, res) => {
  try {
    const { qty } = req.body;

    if (qty === undefined) {
      return res.status(400).json({
        success: false,
        message: "qty is required",
      });
    }

    const item = await CartItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    item.qty = qty;
    await item.save();

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: { item },
    });
  } catch (error) {
    console.error("Error updating cart item:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message,
    });
  }
});

// UPDATE EXISTING CART ITEMS (ADD SIZES)
app.put("/api/cartitem/add", async (req, res) => {
  try {
    const result = await CartItem.updateMany(
      {},
      {
        $set: {
          size: "XL",
          sizes: ["S", "M", "XXL", "XL"],
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All cart items updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating cart items:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart items",
      error: error.message,
    });
  }
});

// DELETE CART ITEM
app.delete("/api/cart/:id", async (req, res) => {
  try {
    const cartItem = await CartItem.findByIdAndDelete(req.params.id);
    if (!cartItem) {
      res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Cart item deleted",
      cart: cartItem,
    });
  } catch (error) {
    console.error("Error deleting cart item:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete cart item",
      error: error.message,
    });
  }
});

// WISHLIST
const WishlistItem = require("./model/WishlistItem.js");

// GET WISHLIST ITEMS
app.get("/api/wishlist", async (req, res) => {
  try {
    const userId = req.query.userId || "default";
    const items = await WishlistItem.find({ userId }).populate("product");

    res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      data: { wishlist: items },
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
});

// ADD ITEM TO WISHLIST
app.post("/api/wishlist", async (req, res) => {
  try {
    const { userId = "default", productId } = req.body;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    // Check if exists
    const exists = await WishlistItem.findOne({ userId, product: productId });

    if (exists) {
      const items = await WishlistItem.find({ userId }).populate("product");
      return res.status(200).json({
        success: true,
        message: "Item already exists in wishlist",
        data: { wishlist: items },
      });
    }
    await WishlistItem.create({ userId, product: productId });

    const items = await WishlistItem.find({ userId }).populate("product");

    return res.status(200).json({
      success: true,
      message: "Item added to wishlist",
      data: { wishlist: items },
    });
  } catch (error) {
    console.error("Error adding wishlist item:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add item to wishlist",
      error: error.message,
    });
  }
});

// DELETE ITEM FROM WISHLIST
app.delete("/api/wishlist/:id", async (req, res) => {
  try {
    const deleted = await WishlistItem.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wishlist item deleted",
      data: { deleted },
    });
  } catch (error) {
    console.error("Error deleting wishlist item:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete wishlist item",
      error: error.message,
    });
  }
});

// ADDRESS
const Address = require("./model/Address.js");
// GET ADDRESSES
app.get("/api/addresses", async (req, res) => {
  try {
    const userId = req.query.userId || "default";
    const addresses = await Address.find({ userId });

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      data: { addresses },
    });
  } catch (error) {
    console.error("Error fetching addresses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
      error: error.message,
    });
  }
});

// CREATE ADDRESS
app.post("/api/addresses", async (req, res) => {
  try {
    const { userId = "default" } = req.body;

    const addr = await Address.create({
      ...req.body,
      userId,
    });

    const addresses = await Address.find({ userId });

    return res.status(200).json({
      success: true,
      message: "Address added successfully",
      data: { addresses },
    });
  } catch (error) {
    console.error("Error creating address:", error.message);
    return res.status(400).json({
      success: false,
      message: "Failed to create address",
      error: error.message,
    });
  }
});

// UPDATE ADDRESS
app.put("/api/addresses/:id", async (req, res) => {
  try {
    const addr = await Address.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!addr) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: { address: addr },
    });
  } catch (error) {
    console.error("Error updating address:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: error.message,
    });
  }
});

// DELETE ADDRESS
app.delete("/api/addresses/:id", async (req, res) => {
  try {
    const deleted = await Address.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: { deleted },
    });
  } catch (error) {
    console.error("Error deleting address:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete address",
      error: error.message,
    });
  }
});

// ORDERED
const Order = require("./model/Order.js");

// GET ORDERS FOR USER
app.get("/api/orders", async (req, res) => {
  try {
    const userId = req.query.userId || "default";
    const orders = await Order.find({ userId }).populate("items.product");

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: { orders },
    });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

// CREATE ORDER
app.post("/api/orders", async (req, res) => {
  try {
    const { userId = "default", items, total, address } = req.body;

    // basic validation (do not change core logic)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "items is required and should be a non-empty array",
      });
    }
    if (total === undefined) {
      return res.status(400).json({
        success: false,
        message: "total is required",
      });
    }

    const order = await Order.create({ userId, items, total, address });

    // clear cart for this user (keeps your original logic)
    await CartItem.deleteMany({ userId });

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Error creating order:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
});

// DELETE ORDER
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      data: { deleted },
    });
  } catch (error) {
    console.error("Error deleting order:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Hello, Welcome to express routes.");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});

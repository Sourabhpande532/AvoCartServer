const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("./model/Product");

const descriptions = {
  "jacket": "Stay warm and stylish with this premium jacket. Crafted with high-quality materials for ultimate comfort and durability. Perfect for layering in cold weather or making a bold fashion statement. Features multiple functional pockets and a sleek modern fit.",
  "shoe": "Step up your footwear game with these stylish and comfortable shoes. Engineered with advanced cushioning for all-day support. Features a durable outsole for excellent traction and a breathable upper design. Perfect for both casual outings and active wear.",
  "shirt": "Elevate your everyday wardrobe with this classic shirt. Made from ultra-soft, breathable fabric for maximum comfort. Designed with a tailored fit that flatters any body type. Versatile enough for both casual weekends and smart-casual office settings.",
  "pant": "Experience the perfect blend of style and comfort with these premium pants. Designed with a flexible waistband and stretch fabric for unrestricted movement. Features a timeless cut that pairs well with any top. Highly durable for everyday wear.",
  "dress": "Make a stunning impression with this elegant dress. Carefully tailored to accentuate your silhouette with graceful lines. Made from lightweight, flowy fabric that feels amazing against your skin. Perfect for evening events, parties, or special occasions.",
  "coat": "Brave the elements in luxury with this sophisticated coat. Featuring superior insulation to keep you warm on the coldest days. Designed with a timeless aesthetic that complements any outfit. Includes a weather-resistant outer layer for maximum protection.",
  "bag": "Carry your essentials in style with this highly functional bag. Built with premium, durable materials to withstand daily use. Features multiple compartments for effortless organization. A perfect accessory that combines fashion and practicality.",
  "jeans": "Classic style meets everyday comfort in these premium jeans. Constructed from durable, high-quality denim that gets better with time. Designed with a versatile fit that seamlessly transitions from day to night. Features reinforced stitching for long-lasting wear."
};

function getDesc(title) {
  const t = title.toLowerCase();
  for (const [key, desc] of Object.entries(descriptions)) {
    if (t.includes(key)) return desc;
  }
  return `Experience premium quality with our ${title}. Carefully crafted to provide the best experience and durability. This item is designed with modern aesthetics and maximum comfort in mind. A perfect addition to elevate your everyday lifestyle.`;
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to DB");
    
    const products = await Product.find({});
    console.log(`Found ${products.length} products to update.`);
    
    let count = 0;
    for (let p of products) {
      p.description = getDesc(p.title);
      await p.save();
      count++;
    }
    
    console.log(`Successfully updated ${count} products.`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

run();

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");

const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());
const Product = require("./models/Product");

/* Connect DB */
(async () => {
  try {
    // use a well‑known public DNS to avoid local SRV lookup failures
    dns.setServers(["8.8.8.8"]);
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
})();

/* ROUTES */
app.post("/add-review/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    product.reviews.push(req.body);

    const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.avgRating = total / product.reviews.length;

    await product.save();

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.get("/low-stock", async (req, res) => {
  const result = await Product.aggregate([
    { $unwind: "$variants" },
    { $match: { "variants.stock": { $lt: 10 } } },
    {
      $group: {
        _id: "$name",
        variants: { $push: "$variants" }
      }
    }
  ]);

  res.json(result);
});
app.get("/category-ratings", async (req, res) => {
  const result = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        avgCategoryRating: { $avg: "$avgRating" }
      }
    }
  ]);

  res.json(result);
});
app.put("/update-stock/:id", async (req, res) => {
  try {
    const { sku, quantity } = req.body;
    const product = await Product.findById(req.params.id);

    await product.updateStock(sku, quantity);

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// list all products (used by front-end)
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/add-product", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* START SERVER (ALWAYS LAST) */
app.listen(5000, () => console.log("Server running on port 5000"));
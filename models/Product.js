const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  color: String,
  price: Number,
  stock: Number
});

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: String
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, index: true },
  variants: [variantSchema],
  reviews: [reviewSchema],
  avgRating: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

/* -----------------------------
   Calculate Average Rating
------------------------------*/
productSchema.methods.calculateAvgRating = function () {
  if (this.reviews.length === 0) {
    this.avgRating = 0;
  } else {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.avgRating = total / this.reviews.length;
  }
  return this.save();
};

/* -----------------------------
   Stock Update Method
------------------------------*/
productSchema.methods.updateStock = function (sku, quantity) {
  const variant = this.variants.find(v => v.sku === sku);
  if (!variant) throw new Error("Variant not found");

  variant.stock -= quantity;
  if (variant.stock < 0) throw new Error("Out of stock");

  return this.save();
};

/* -----------------------------
   Index for performance
------------------------------*/
productSchema.index({ name: "text", category: 1 });
productSchema.methods.updateStock = function (sku, quantity) {
  const variant = this.variants.find(v => v.sku === sku);

  if (!variant) throw new Error("Variant not found");
  if (variant.stock < quantity) throw new Error("Out of stock");

  variant.stock -= quantity;

  return this.save();
};
module.exports = mongoose.model("Product", productSchema);
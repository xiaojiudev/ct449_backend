const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide product name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    price: {
      type: Number,
      required: [true, "Please provide price value"],
      default: 0,
    },
    description: {
      type: String,
      required: [true, "Please provide description"],
      maxlength: [1000, "Description can not be more than 1000 characters"],
    },
    image: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Please provide category"],
      enum: ["flower", "keychain"],
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// All reviews associated with that product.
ProductSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
  justOne: false,
  // match: {rating: 5} // Get the reviews whose rating is only 5.
})

ProductSchema.pre("remove", async function (next) {
  // Go to 'Reveiw; and delete all the review that are associated with this particular product
  await this.model("Review").deleteMany({ product: this._id })
})

module.exports = new mongoose.model("Product", ProductSchema)

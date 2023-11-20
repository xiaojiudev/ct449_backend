const mongoose = require("mongoose");

const Product = require("../models/productModel");

const CartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: {
            type: String,
        },
        image: {
            type: String,
        },
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        subTotal: {
            type: Number,
        },
    },
    { _id: false, }
);

const ShoppingCartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            unique: true, // Each user can have only one cart
            required: true,
        },
        items: [CartItemSchema],
        totalPrice: {
            type: Number,
            default: 0,
        }
    },
    { timestamps: true, }
);

// Add a product to the cart or update its quantity
ShoppingCartSchema.methods.addToCart = async function (productId, quantity) {

    const product = await Product.findById(productId);

    if (!product) {
        throw new Error("Product not found");
    }

    const existingItem = this.items.find((item) => item.product.equals(productId));

    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = product.price;
    } else {
        this.items.push(
            {
                product: productId,
                quantity,
                price: product.price,
            }
        );
    }

    this.totalPrice = calculateTotalPrice(this.items);

    return this.save();
}

// Remove a product from the cart
ShoppingCartSchema.methods.removeFromCart = function (productId) {
    this.items = this.items.filter((item) => !item.product.equals(productId));
    return this.save();
}

// Clear the cart (remove all items)
ShoppingCartSchema.methods.clearCart = function () {
    this.items = [];
    return this.save();
};

// Calculate and update the totalPrice in the cart
const calculateTotalPrice = (items) => {
    const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

    return Number(totalPrice.toFixed(2));
};

const ShoppingCart = mongoose.model("ShoppingCart", ShoppingCartSchema);

module.exports = ShoppingCart;

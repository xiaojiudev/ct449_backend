const mongoose = require("mongoose")

const OrderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        name: {
            type: String,
            required: true,
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
    },
    { _id: false, }
)

const OrderSchema = new mongoose.Schema(
    {

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        userFullname: {
            type: String,
        },

        address: {
            type: String,
        },

        shippingFee: {
            type: Number,
            required: true,
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        total: {
            type: Number,
            required: true,
            min: 0,
        },

        orderItems: [OrderItemSchema],

        status: {
            type: String,
            enum: ["pending", "failed", "paid", "delivered", "canceled"],
            default: "pending",
        },

        paymentIntentID: {
            type: String,
            enum: ["COD"],
            default: "COD"
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model("Order", OrderSchema)

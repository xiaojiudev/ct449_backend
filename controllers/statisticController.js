const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const Order = require("../models/orderModel");
const Product = require("../models/productModel");


const statisticWeb = async (req, res) => {
    try {
        // Statistics of Products Sold
        const productStats = await Order.aggregate([
            {
                $unwind: "$orderItems"
            },
            {
                $match: { status: "paid" } 
            },
            {
                $group: {
                    _id: "$orderItems.product",
                    totalQuantitySold: { $sum: "$orderItems.quantity" },
                    totalCost: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $project: {
                    _id: 0,
                    productName: { $arrayElemAt: ["$productDetails.name", 0] },
                    totalQuantitySold: 1,
                    unitPrice: { $arrayElemAt: ["$productDetails.price", 0] },
                    totalCost: { $round: ["$totalCost", 2] }
                }
            },
        ]);

        // Daily Revenue Statistics
        const dailyRevenue = await Order.aggregate([
            {
                $match: { status: "paid" } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalRevenue: { $sum: "$total" }
                }
            },
        ]);

        // Statistics on Number of Orders by Day
        const ordersByDay = await Order.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        res.status(StatusCodes.OK).json({
            productStats,
            dailyRevenue,
            ordersByDay
        });
    } catch (error) {
        console.error('Error calculating statistics:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error calculating statistics' });
    }

}

module.exports = {
    statisticWeb,
}
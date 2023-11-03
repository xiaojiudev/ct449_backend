const { StatusCodes } = require("http-status-codes");

const Product = require("../models/productModel");
const ShoppingCart = require("../models/cartModel");
const Order = require("../models/orderModel");
const CustomError = require("../errors");

// GET ALL ORDERS  
const getAllOrders = async (req, res) => {
    res.send("Get all orders")
}

// GET SINGLE ORDERS  
const getOrder = async (req, res) => {
    res.send("Get single order")
}

// GET CURRENT USER ORDERS 
const getCurrentUserOrder = async (req, res) => {
    res.send("Get a current user orders")
}

// CREATE ORDER  
// const createOrder = async (req, res) => {
//     const { userId } = req.user;

//     try {
//         // Find user's shopping cart
//         const cart = await ShoppingCart.findOne({ user: userId });


//         if (!cart || cart.items.length === 0) {
//             return res.status(StatusCodes.NOT_FOUND).json({ message: "User cart not found or is empty" });
//         }

//         // Fetch the latest product prices
//         const productIds = cart.items.map(item => item.product);

//         const products = await Product.find({ _id: { $in: productIds } })

//         const productPriceMap = {};
//         const productStockMap = {};
//         let insufficientProduct = null;


//         products.forEach((product) => {
//             productPriceMap[product._id] = product.price;
//             productStockMap[product._id] = product.quantityInStock;
//         });

//         let subtotal = 0.00;
//         let canPlaceOrder = true;
//         const updatedOrderItems = [];

//         cart.items.forEach((item) => {
//             if (productPriceMap[item.product]) {
//                 const itemPrice = productPriceMap[item.product] * item.quantity;
//                 const itemStock = productStockMap[item.product];

//                 if (itemStock >= item.quantity) {
//                     subtotal += itemPrice;

//                     updatedOrderItems.push({
//                         product: item.product,
//                         price: productPriceMap[item.product],
//                         quantity: item.quantity,
//                     });
//                 } else {
//                     canPlaceOrder = false;
//                     insufficientProduct = products.find((product) => product._id.equals(item.product));
//                     return;
//                 }
//             }
//         });

//         if (canPlaceOrder) {
//             subtotal = parseFloat(subtotal.toFixed(2));
//             const shippingFee = 10.00;
//             const total = parseFloat((subtotal + shippingFee).toFixed(2));

//             const order = await Order.create({

//                 user: userId,
//                 shippingFee,
//                 subtotal,
//                 total,
//                 orderItems: updatedOrderItems,
//                 status: "pending",
//             });

//             await cart.clearCart();

//             res.status(StatusCodes.CREATED).json({ order });

//         } else {
//             res.status(StatusCodes.BAD_REQUEST).json({ message: `${insufficientProduct.name} insufficient quantity in stock` });
//         }
//     } catch (error) {
//         res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating order" });
//     }

// }
const createOrder = async (req, res) => {
    const { userId } = req.user;

    try {
        const cart = await ShoppingCart.findOne({ user: userId }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "User cart not found or is empty" });
        }

        const productPriceMap = new Map();
        const insufficientProducts = [];

        let subtotal = 0.00;
        let canPlaceOrder = true;
        const updatedOrderItems = [];

        for (const cartItem of cart.items) {
            const product = cartItem.product;

            if (!product || product.quantityInStock < cartItem.quantity) {
                insufficientProducts.push(product?.name);
                canPlaceOrder = false;
            } else {
                productPriceMap.set(product._id.toString(), product.price);
                const itemPrice = productPriceMap.get(product._id.toString()) * cartItem.quantity;
                subtotal += itemPrice;

                updatedOrderItems.push({
                    product: product._id,
                    price: productPriceMap.get(product._id.toString()),
                    quantity: cartItem.quantity,
                });
            }
        }

        if (!canPlaceOrder) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: `Insufficient quantity in stock for products: ${insufficientProducts.join(", ")}`
            });
        }

        const shippingFee = 10.00;
        const total = parseFloat((subtotal + shippingFee).toFixed(2));

        const order = await Order.create({
            user: userId,
            shippingFee,
            subtotal: parseFloat(subtotal.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            orderItems: updatedOrderItems,
            status: "pending",
        });

        await cart.clearCart();

        res.status(StatusCodes.CREATED).json({ order });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating order" });
    }
};

// UPDATE ORDER  
const updateOrder = async (req, res) => {
    res.send("Update order")
}

module.exports = {
    getAllOrders,
    getOrder,
    getCurrentUserOrder,
    createOrder,
    updateOrder,
}

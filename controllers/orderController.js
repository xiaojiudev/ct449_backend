const { StatusCodes } = require("http-status-codes");

const Product = require("../models/productModel");
const ShoppingCart = require("../models/cartModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const CustomError = require("../errors");
const emailService = require("../utils/index");

// GET ALL ORDERS  
const getAllOrders = async (req, res) => {
    try {

        let queryParams = {};

        if (req.query.status) {
            queryParams.status = req.query.status;
        }

        const orders = await Order.find(queryParams);

        return res.status(StatusCodes.OK).json({ orders });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error fetching all orders" });
    }
}

// GET SINGLE ORDER
const getOrder = async (req, res) => {
    const orderId = req.params.id;
    try {
        const order = await Order.findById(orderId);

        return res.status(StatusCodes.OK).json({ order });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: `Error fetching order with ${orderId}` });
    }
}

// GET CURRENT USER ORDERS 
const getCurrentUserOrder = async (req, res) => {
    const { userId } = req.user;

    try {
        const userOrder = await Order.find({ user: userId });

        return res.status(StatusCodes.OK).json({ userOrder });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: `Error fetching current user order` });
    }
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

    // console.log(userId);
    try {
        const cart = await ShoppingCart.findOne({ user: userId }).populate({
            path: 'items.product',
            select: 'name price quantityInStock image',
            populate: { path: 'user', select: 'name address' },
        });

        const user = await User.findOne({_id: userId})

        // console.log("User is: ", user);

        const { name, address } = user

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
                    product: {
                        _id: product._id,
                        name: product.name,
                    },
                    price: productPriceMap.get(product._id.toString()),
                    quantity: cartItem.quantity,
                    name: product.name, 
                    image: product.image,
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
            userFullname: name,
            address: address,
            shippingFee,
            subtotal: parseFloat(subtotal.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            orderItems: updatedOrderItems,
            status: "pending",
        });

        await cart.clearCart();

        return res.status(StatusCodes.CREATED).json({ order });
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating order" });
    }
};

// UPDATE ORDER  
const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatus = ["pending", "failed", "paid", "delivered", "canceled"];
        if (!validStatus.includes(status)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid status" });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Order not found" });
        }

        const isDeliveredStatusChange = order.status !== "delivered" && status === "delivered";

        order.status = status;

        if (isDeliveredStatusChange) {
            let orderItemsHTML = ``;

            for (const item of order.orderItems) {
                const product = await Product.findById(item.product);

                if (!product) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: "Product not found" });
                }
                product.quantityInStock = Math.max(0, product.quantityInStock - item.quantity);
                orderItemsHTML += generateOrderItemHTML(product, item.quantity);

                await product.save();
            }

            // sending email to user to notify order is delivered
            const user = await User.findById(order.user);


            if (user) {
                const userEmail = user.email;
                const userName = user.name;
                const emailSubject = "Your Order is Delivered";

                const { updatedAt, _id, subtotal, shippingFee, total, orderItems, paymentIntentID } = order;

                let htmlTemplate = `
                <!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email</title>
    </head>
    <body>
        <div style="max-width: 650px;margin:auto; box-shadow: rgba(135, 138, 153, 0.10) 0 5px 20px -6px;border-radius: 6px;border: 1px solid #eef1f5;overflow: hidden;background-color: #fff;">
            <div style="padding: 1.5rem;background-color: #fafafa;">
                <a href="index.html"><img src="https://res.cloudinary.com/de8xbko8y/image/upload/v1699103298/flutter/icon_q35sd9.png" alt="" height="28" style="display: block;margin: 0 auto;"></a>
            </div>
            <div style="padding: 1.5rem;">
                <h5 style="font-size: 18px;font-family: 'Inter', sans-serif;font-weight: 600;margin-bottom: 18px;margin-top: 0px;line-height: 1.2;">Your Order Confirmed!</h5>
                <h6 style="font-size: 16px;font-weight: 500;margin-bottom: 12px;margin-top: 0px;line-height: 1.2;">Hello, ${userName}</h6>
                <p style="color: #878a99 !important; margin-bottom: 20px;margin-top: 0px;">Your order has been confirmed and will be shipping soon.</p>
                <table style="width: 100%;" cellspacing="0" cellpadding="0">
                    <tbody>
                        <tr>
                            <td style="padding: 5px; vertical-align: top;">
                                <p style="color: #878a99 !important; margin-bottom: 12px; font-size: 13px; text-transform: uppercase;font-weight: 500;margin-top: 0px;">Order Date</p>
                                <h6 style="font-size: 15px; margin: 0px;font-weight: 600; font-family: 'Inter', sans-serif;">${new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</h6>
                            </td>
                            <td style="padding: 5px; vertical-align: top;">
                                <p style="color: #878a99 !important; margin-bottom: 12px; font-size: 13px; text-transform: uppercase;font-weight: 500;margin-top: 0px;">Order ID</p>
                                <h6 style="font-size: 15px; margin: 0px;font-weight: 600; font-family: 'Inter', sans-serif;">${_id}</h6>
                            </td>
                            <td style="padding: 5px; vertical-align: top;">
                                <p style="color: #878a99 !important; margin-bottom: 12px; font-size: 13px; text-transform: uppercase;font-weight: 500;margin-top: 0px;">Payment</p>
                                <h6 style="font-size: 15px; margin: 0px;font-weight: 600; font-family: 'Inter', sans-serif;">${paymentIntentID == 'COD' ? 'Cash On Delivery' : paymentIntentID}</h6>
                            </td>
                            <td style="padding: 5px; vertical-align: top;">
                                <p style="color: #878a99 !important; margin-bottom: 12px; font-size: 13px; text-transform: uppercase;font-weight: 500;margin-top: 0px;">Address</p>
                                <h6 style="font-size: 15px; margin: 0px;font-weight: 600; font-family: 'Inter', sans-serif;">${'VietNam'}</h6>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <h6 style="font-family: 'Inter', sans-serif; font-size: 15px;font-weight: 600; text-decoration-line: underline;margin-bottom: 16px;margin-top: 20px;">Here what you ordered:</h6>
                <table style="width: 100%;border-collapse: collapse;" cellspacing="0" cellpadding="0">
                    <tbody>
                        ${orderItemsHTML}
                        <tr>
                            <td colspan="3" style="padding: 12px 8px; font-size: 15px;border-top: 1px solid #e9ebec;">
                                Subtotal
                            </td>
                            <td style="padding: 12px 8px; font-size: 15px;text-align: end; border-top: 1px solid #e9ebec;">
                                <h6 style="font-size: 15px; margin: 0px;font-weight: 600; font-family: 'Inter', sans-serif;">$${subtotal}</h6>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 12px 8px; font-size: 15px;">
                                Shipping Charge
                            </td>
                            <td style="padding: 12px 8px; font-size: 15px;text-align: end; ">
                                <h6 style="font-size: 15px; margin: 0px;font-weight: 600; font-family: 'Inter', sans-serif;">$${shippingFee}</h6>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 12px 8px; font-size: 15px;">
                                Taxs (0.00%)
                            </td>
                            <td style="padding: 12px 8px; font-size: 15px;text-align: end; ">
                                <h6 style="font-size: 15px; margin: 0px;font-weight: 600; font-family: 'Inter', sans-serif;">$${0.00}</h6>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 12px 8px; font-size: 15px;">
                                Discount
                            </td>
                            <td style="padding: 12px 8px; font-size: 15px;text-align: end; ">
                                <h6 style="font-size: 15px; margin: 0px;font-weight: 600; font-family: 'Inter', sans-serif;">$${0.00}</h6>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 12px 8px; font-size: 15px;border-top: 1px solid #e9ebec;">
                                Total Amount
                            </td>
                            <td style="padding: 12px 8px; font-size: 15px;text-align: end; border-top: 1px solid #e9ebec;">
                                <h6 style="font-size: 15px; margin: 0px;font-weight: 600; font-family: 'Inter', sans-serif;">$${total}</h6>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p style="color: #878a99; margin-bottom: 20px;margin-top: 15px;">We'll send you shipping Confirmation when your item(s) are on the way! We appreciate your business, and hope you enjoy your purchase.</p>
                <div style="text-align: right;">
                    <h6 style="font-size: 15px; margin: 0px;font-weight: 500;font-size: 17px; font-family: 'Inter', sans-serif;">Thank you!</h6>
                    <p style="color: #878a99; margin-bottom: 0;margin-top: 8px;">Dandelion</p>
                </div>
            </div>
            <div style="padding: 1.5rem;background-color: #fafafa;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="width: 50%; color: #878a99;">
                            Questions? Contact Our <a href="https://www.facebook.com/pugongying999" style="text-decoration: none; color: #676fb2;">Customer Support</a>
                        </td>
                        <td style="width: 50%; text-align: right; color: #878a99;">
                            <script>document.write(new Date().getFullYear())</script> 2023 © XiaoJiu.
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </body>
</html>
            `;

                await emailService.sendEmail(userEmail, emailSubject, htmlTemplate);
            }
        }

        await order.save();

        return res.status(StatusCodes.OK).json({ order });

    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error updating order" });
    }
}

function generateOrderItemHTML(item, quantity) {

    const { name, price, description, image, category } = item;

    return `<tr>
    <td style="padding: 12px 5px; vertical-align: top;width: 65px;">
        <div style="border: 1px solid #eaeef4;height: 64px;width: 64px;display: flex; align-items: center;justify-content: center;border-radius: 6px;">
            <img src="${image}" alt="${name}" style="width: 100%; height: 100%; object-fit:cover;">
        </div>
    </td>
    <td style="padding: 12px 5px; vertical-align: top;">
        <h6 style="font-size: 15px; margin: 0px;font-weight: 500; font-family: 'Inter', sans-serif;">${name}</h6>
        <p style="color: #878a99 !important; margin-bottom: 10px; font-size: 13px;font-weight: 500;margin-top: 6px;">${description}</p>
        <p style="color: #878a99 !important; margin-bottom: 0px; font-size: 13px;font-weight: 500;margin-top: 0;"><span>Category: ${category}</span> <span style="margin-left: 15px;">${''}</span></p>
    </td>
    <td style="padding: 12px 5px; vertical-align: top;">
        <h6 style="font-size: 15px; margin: 0px;font-weight: 400; font-family: 'Inter', sans-serif;">Qty ${quantity}</h6>
    </td>
    <td style="padding: 12px 5px; vertical-align: top;text-align: end;">
        <h6 style="font-size: 15px; margin: 0px;font-weight: 600; font-family: 'Inter', sans-serif;">$${price}</h6>
    </td>
</tr>
    `;
}


module.exports = {
    getAllOrders,
    getOrder,
    getCurrentUserOrder,
    createOrder,
    updateOrder,
}

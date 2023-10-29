const { StatusCodes } = require("http-status-codes");

const ShoppingCart = require("../models/cartModel");
const Product = require("../models/productModel");
const CustomError = require("../errors");

// Add a product to the shopping cart
const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const { userId } = req.user;


    try {
        // Check if product is exist
        const product = await Product.findById(productId);

        if (!product) {
            throw new CustomError.NotFoundError(`No product found with ID ${productId}`);
        }

        // Find or create a user's shopping cart
        const shoppingCart = await ShoppingCart.findOneAndUpdate(
            { user: userId },
            { user: userId },
            { upsert: true, new: true }
        );

        if (quantity <= 0 || quantity > product.quantityInStock) {
            throw new CustomError.BadRequestError(
                `Quantity must be greater than zero and less than ${product.quantityInStock}`
            );
        }

        // Add the product to cart or update its quantity
        const userCart = await shoppingCart.addToCart(productId, quantity);

        res.status(StatusCodes.CREATED).json(userCart);
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(error.statusCode).json({ message: error.message });
    }
}

// Remove a product from the shopping cart
const removeProductFromCart = async (req, res) => {
    const { productId } = req.body;
    const { userId } = req.user;

    try {
        const shoppingCart = await ShoppingCart.findOne({ user: userId });

        if (!shoppingCart) {
            throw new CustomError.NotFoundError('No active shopping cart found');
        }

        // Remove the product from the cart
        await shoppingCart.removeFromCart(productId);

        res.status(StatusCodes.OK).json({ message: 'Product removed from the cart' });
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(error.statusCode).json({ message: error.message });
    }
};

// Clear the entire cart
const clearCart = async (req, res) => {
    const { userId } = req.user;

    try {
        const cart = await ShoppingCart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Clear all items in the cart
        await cart.clearCart();

        res.status(200).json({ message: "Cart cleared" });
    } catch (error) {
        console.log(err);
        res.status(err.statusCode).json({ message: err.message });
    }
};

const getUserCart = async (req, res) => {
    const { userId } = req.user;

    try {
        const cart = await ShoppingCart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        res.status(200).json({ message: cart });
    } catch (error) {
        console.error(error);
        res.status(err.statusCode).json({ message: err.message });
    }
};

module.exports = {
    addToCart,
    removeProductFromCart,
    clearCart,
    getUserCart,
}
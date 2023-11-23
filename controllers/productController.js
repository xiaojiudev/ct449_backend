const { StatusCodes } = require("http-status-codes");

const Product = require("../models/productModel");
const CustomError = require("../errors");
const { uploadImageToCloudinary, deleteImageFromCloudinary, extractPublicId } = require("../utils");

// CREATE PRODUCT
const createProduct = async (req, res) => {
    req.body.user = req.user.userId

    if (req.file) {
        try {
            const tempFilePath = req.file.path;
            const response = await uploadImageToCloudinary(tempFilePath);

            const { secure_url } = response;

            req.body.image = secure_url;

        } catch (error) {
            throw new CustomError.ServerError('Image upload failed');
        }
    }

    const product = await Product.create(req.body)
    res.status(StatusCodes.CREATED).json({ product })
}

// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {

    // const product = await Product.find({})
    // res.status(StatusCodes.OK).json({ total_products: product.length, product })
    try {
        const { search, category } = req.query;
        let productQuery = {};

        if (search) {
            const searchPattern = new RegExp(search, 'i');
            productQuery = { name: searchPattern };
        }

        if (category) {
            productQuery.category = category;
        }

        const products = await Product.find(productQuery);

        res.status(StatusCodes.OK).json({ total_products: products.length, product: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching products' });
    }

}

// GET SINGLE PRODUCT
const getSingleProduct = async (req, res) => {
    const { id: productId } = req.params
    const product = await Product.findOne({ _id: productId }).populate("reviews")
    if (!product) {
        throw new CustomError.BadRequestError(`No product with the id ${productId}`)
    }
    res.status(StatusCodes.OK).json({ product })
}

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
    const { id: productId } = req.params

    const product = await Product.findOne({ _id: productId });

    if (!product) {
        throw new CustomError.BadRequestError(`No product with the id ${productId}`);
    }

    try {
        // Handle image update if there's a new image file
        if (req.file) {
            const tempFilePath = req.file.path;
            const response = await uploadImageToCloudinary(tempFilePath);
            const { secure_url } = response;
            req.body.image = secure_url;

            // Delete the old image from Cloudinary
            if (product?.image) {
                await deleteImageFromCloudinary(extractPublicId(product?.image));
            }
        } else {
            req.body.image = product?.image;
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(StatusCodes.OK).json({ product: updatedProduct });
    } catch (error) {
        console.log("Error updating product:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "An error occurred while updating the product" });
    }
}

// DELETE PRODUCT
const deleteProduct = async (req, res) => {

    const { id: productId } = req.params;
    const product = await Product.findOne({ _id: productId });

    if (!product) {
        throw new CustomError.BadRequestError(`No product with the id ${productId}`);
    }

    try {

        const imageUrl = product?.image;

        if (imageUrl) {
            await deleteImageFromCloudinary(extractPublicId(imageUrl));
        }

        await Product.findByIdAndDelete(productId);
        await product.remove(); // This will trigger the pre-remove hook

        res.status(StatusCodes.OK).json({ msg: "Success! Product removed" });
    } catch (error) {
        console.log("Error deleting product:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "An error occurred while deleting the product" });
    }
}



module.exports = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
}

const express = require("express");
const router = express.Router();

const {
    addToCart,
    removeProductFromCart,
    clearCart,
    getUserCart,
} = require("../controllers/cartController");

const {
    authenticateUser,
    authorizePermissions,
} = require("../middleware/authentication");

router
    .route("/")
    .get([authenticateUser], getUserCart)
    .post([authenticateUser], addToCart)

router
    .route("/:id")
    .delete([authenticateUser], removeProductFromCart)

router
    .route("/clear")
    .delete([authenticateUser], clearCart)

module.exports = router
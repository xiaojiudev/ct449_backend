const express = require("express")
const router = express.Router()

const {
    authenticateUser,
    authorizePermissions,
} = require("../middleware/authentication")

const {
    getAllOrders,
    getOrder,
    getCurrentUserOrder,
    createOrder,
    updateOrder,
} = require("../controllers/orderController")

router
    .route("/")
    .post(authenticateUser, createOrder)
    .get(authenticateUser, authorizePermissions("admin"), getAllOrders)

router.route("/myOrders")
    .get(authenticateUser, getCurrentUserOrder)

router
    .route("/:id")
    .get(authenticateUser, getOrder)

router
    .route("/:id/updateStatus")
    .patch(authenticateUser, authorizePermissions("admin"), updateOrder)




module.exports = router

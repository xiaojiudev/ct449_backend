const express = require("express");
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

const { getSingleProductReviews } = require("../controllers/reviewController");
const upload = require('../middleware/multer');

router
  .route("/")
  .post([authenticateUser, authorizePermissions("admin"), upload.single('image')], createProduct)
  .get(getAllProducts)

router
  .route("/:id")
  .get(getSingleProduct)
  .patch([authenticateUser, authorizePermissions("admin"), upload.single('image')], updateProduct)
  .delete([authenticateUser, authorizePermissions("admin")], deleteProduct)

router.route("/:id/reviews").get(getSingleProductReviews)

module.exports = router

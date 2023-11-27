const express = require("express")
const router = express.Router()

const {
    statisticWeb,

} = require("../controllers/statisticController.js")

const { authenticateUser } = require("../middleware/authentication")

router.route("/").get(authenticateUser, statisticWeb)

module.exports = router

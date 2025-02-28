const express = require("express");
const {
  createOrder,
  verifyPayment,
} = require("../controllers/payments.controller");
const router = express.Router();

router.post("/createOrder", createOrder);
router.post("/verifyPayment", verifyPayment);

module.exports = router;

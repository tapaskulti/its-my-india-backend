const express = require("express");
const {
  createOrder,
  verifyPayment,
  checkCoupon,
} = require("../controllers/payments.controller");
const router = express.Router();

router.post("/createOrder", createOrder);
router.post("/verifyPayment", verifyPayment);
router.post("/checkCoupon", checkCoupon);

module.exports = router;

const express = require('express');
const {
  createOrder,
  verifyPayment,
  checkCoupon,
  sendDetails,
} = require('../controllers/payments.controller');
const router = express.Router();

router.post('/createOrder', createOrder);
router.post('/verifyPayment', verifyPayment);
router.post('/checkCoupon', checkCoupon);
router.post('/sendDetails', sendDetails);

module.exports = router;

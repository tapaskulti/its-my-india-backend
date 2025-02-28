const { createRazorpayInstance } = require('../config/rezorpay.config');
const crypto = require('crypto');
require('dotenv').config();

const razorpayInstance = createRazorpayInstance();

exports.createOrder = async (req, res) => {
  // don't take amount from frontend
  const { bookId } = req.body;

  const amount = process.env.BOOK_NOW;

  if (!amount || !bookId) {
    return res.status(400).json({
      success: false,
      message: 'Amount and Book Id is required',
    });
  }

  function generateReceiptId() {
    return `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  const options = {
    amount: amount * 100, // in Paisa
    currency: 'INR',
    receipt: generateReceiptId(),
  };

  try {
    razorpayInstance.orders.create(options, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Some error occured',
        });
      }
      return res.status(200).json({
        success: true,
        data: result,
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const secret = process.env.RAZORPAY_KEY_SECRET;

  // create hmac object
  const hmac = crypto.createHmac('sha256', secret);

  hmac.update(razorpay_order_id + '|' + razorpay_payment_id);

  const generateSignature = hmac.digest('hex');

  if (generateSignature === razorpay_signature) {
    return res.status(200).json({
      success: true,
      message: 'Payment verified',
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Payment not verified',
    });
  }
};

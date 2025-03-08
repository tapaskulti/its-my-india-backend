const { createRazorpayInstance } = require("../config/rezorpay.config");
const crypto = require("crypto");

const { COUPON } = require("../constants/coupon");

require("dotenv").config();

const razorpayInstance = createRazorpayInstance();

exports.createOrder = async (req, res) => {
  // don't take amount from frontend
  const { coupon = "" } = req.body;

  let parsedCoupon = "";
  if (typeof coupon === "string") {
    parsedCoupon = coupon;
  }

  const amount = process.env.BOOK_NOW;

  if (!amount) {
    return res.status(400).json({
      success: false,
      message: "Amount and Book Id is required",
    });
  }

  function generateReceiptId() {
    return `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  const isValidCoupon = Object.keys(COUPON).some(
    (COUPON) => COUPON === parsedCoupon.trim()
    // .toLowerCase() method on bothe side for case insensitive
  );

  const discountPercentage = isValidCoupon ? COUPON[parsedCoupon] : 0;
  const discountedAmount = (discountPercentage / 100) * amount;
  const purchasePrice = amount - discountedAmount;

  const options = {
    amount: purchasePrice * 100, // in Paisa
    currency: "INR",
    receipt: generateReceiptId(),
  };

  try {
    razorpayInstance.orders.create(options, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Some error occured",
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
      message: "Something went wrong",
    });
  }
};


exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const secret = process.env.RAZORPAY_KEY_SECRET;

  // create hmac object
  const hmac = crypto.createHmac("sha256", secret);

  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);

  const generateSignature = hmac.digest("hex");

  if (generateSignature === razorpay_signature) {
    return res.status(200).json({
      success: true,
      message: "Payment verified",
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Payment not verified",
    });
  }
};

exports.checkCoupon = async (req, res) => {
  const { coupon } = req.body;

  if (!coupon) {
    res.status(400).json({ message: "Coupon Not Provided." });
    return;
  }

  if (typeof coupon !== "string") {
    res.status(400).json({ message: "Coupon must be string." });
    return;
  }

  const isValidCoupon = Object.keys(COUPON).some(
    (COUPON) => COUPON === coupon.trim()
    // .toLowerCase() method on bothe side for case insensitive
  );

  if (!isValidCoupon) {
    res.status(400).json({ message: "Coupon is not Valid" });
    return;
  }

  res.status(201).json({ message: "Coupon is Valid" });
};

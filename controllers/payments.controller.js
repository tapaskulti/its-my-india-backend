const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { createRazorpayInstance } = require('../config/rezorpay.config');
const crypto = require('crypto');

const { COUPON } = require('../constants/coupon');

require('dotenv').config();

const razorpayInstance = createRazorpayInstance();

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

exports.createOrder = async (req, res) => {
  // don't take amount from frontend
  const { coupon = '' } = req.body;

  let parsedCoupon = '';
  if (typeof coupon === 'string') {
    parsedCoupon = coupon;
  }

  const amount = process.env.BOOK_NOW;

  if (!amount) {
    return res.status(400).json({
      success: false,
      message: 'Amount and Book Id is required',
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

exports.checkCoupon = async (req, res) => {
  const { coupon } = req.body;

  if (!coupon) {
    res.status(400).json({ message: 'Coupon Not Provided.' });
    return;
  }

  if (typeof coupon !== 'string') {
    res.status(400).json({ message: 'Coupon must be string.' });
    return;
  }

  const isValidCoupon = Object.keys(COUPON).some(
    (COUPON) => COUPON === coupon.trim()
    // .toLowerCase() method on bothe side for case insensitive
  );

  if (!isValidCoupon) {
    res.status(400).json({ message: 'Coupon is not Valid' });
    return;
  }

  res.status(201).json({ message: 'Coupon is Valid' });
};

exports.sendDetails = async (req, res) => {
  const payment_id = req.query['payment-id'];

  if (!payment_id || typeof payment_id !== 'string') {
    return res.status(401).json({ message: 'Provide Payment Id' });
  }

  const { customerName, customerEmail, customerAddress, contactNo } = req.body;

  if (!customerName || !customerEmail || !customerAddress || !contactNo) {
    return res.status(422).json({ message: 'Send all Details' });
  }

  const clientDetailsTemplate = fs.readFileSync(
    path.join(__dirname, '../template/clientDetails.hbs'),
    'utf8'
  );

  const template = handlebars.compile(clientDetailsTemplate);

  const clientDetailsBody = template({
    customer_name: customerName,
    address: customerAddress,
    contact_number: contactNo,
    email: customerEmail,
    payment_id,
  });

  try {
    const payment = await razorpayInstance.payments.fetch(payment_id);

    if (payment.status === 'captured') {
      try {
        // Email to admin/yourself
        const adminMailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: 'New Order',
          html: clientDetailsBody,
        };

        // Email to user (acknowledgment)
        const userMailOptions = {
          from: process.env.EMAIL_USER,
          to: customerEmail,
          subject: 'Thank you Buying',
          html: clientDetailsBody,
        };

        // Send both emails concurrently
        await Promise.all([
          transporter.sendMail(adminMailOptions),
          transporter.sendMail(userMailOptions),
        ]);

        res.status(200).json({ message: 'Messages sent successfully' });
      } catch (err) {
        console.error('Email sending error:', err);
        res.status(500).json({ error: 'Failed to send email' });
      }
    }
  } catch (err) {
    if (err.error?.reason === 'input_validation_failed')
      return res.json({ message: err.error?.description || 'Razor Pay error' });
    return res.json({ message: 'Error Occurred' });
  }
};

const crypto = require('crypto');

const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  const receivedSignatureBuffer = Buffer.from(signature);

  return expectedSignatureBuffer.length === receivedSignatureBuffer.length &&
    crypto.timingSafeEqual(expectedSignatureBuffer, receivedSignatureBuffer);
};

module.exports = { verifyPaymentSignature };

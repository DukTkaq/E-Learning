const crypto = require('crypto');
const qs = require('qs');

const VNPAY_VERSION = '2.1.0';
const DEFAULT_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

const encodeVnpayValue = (value) => encodeURIComponent(String(value)).replace(/%20/g, '+');

const normalizeParams = (params) => {
  const normalized = {};

  Object.keys(params)
    .filter((key) => key.startsWith('vnp_'))
    .filter((key) => !['vnp_SecureHash', 'vnp_SecureHashType'].includes(key))
    .sort()
    .forEach((key) => {
      const value = params[key];
      if (value === undefined || value === null || value === '' || Array.isArray(value)) return;
      normalized[key] = encodeVnpayValue(value);
    });

  return normalized;
};

const createSignature = (params, secretKey) => {
  const signData = qs.stringify(normalizeParams(params), { encode: false });
  return crypto.createHmac('sha512', secretKey).update(signData, 'utf8').digest('hex');
};

const verifySignature = (params, secretKey) => {
  const received = String(params.vnp_SecureHash || '').toLowerCase();
  if (!/^[a-f0-9]{128}$/.test(received)) return false;

  const expected = createSignature(params, secretKey);
  return crypto.timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
};

const buildPaymentUrl = (paymentUrl, params, secretKey) => {
  const normalized = normalizeParams(params);
  const signature = createSignature(params, secretKey);
  const query = qs.stringify({ ...normalized, vnp_SecureHash: signature }, { encode: false });
  return `${paymentUrl}?${query}`;
};

const formatVnpayDate = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
};

const getConfig = () => {
  const config = {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    paymentUrl: process.env.VNPAY_PAYMENT_URL || DEFAULT_PAYMENT_URL,
    returnUrl: process.env.VNPAY_RETURN_URL,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  };

  if (!config.tmnCode || !config.hashSecret || !config.returnUrl) {
    throw new Error('VNPay is not configured. Add VNPAY_TMN_CODE, VNPAY_HASH_SECRET and VNPAY_RETURN_URL to server/.env.');
  }

  if (!/^[a-zA-Z0-9]{8}$/.test(config.tmnCode)) {
    throw new Error('VNPAY_TMN_CODE must contain exactly 8 letters or numbers.');
  }

  for (const [name, value] of [
    ['VNPAY_PAYMENT_URL', config.paymentUrl],
    ['VNPAY_RETURN_URL', config.returnUrl],
    ['CLIENT_URL', config.clientUrl],
  ]) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`${name} must be a valid absolute URL.`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`${name} must use HTTP or HTTPS.`);
    }
  }

  return config;
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0];
  const normalized = (ip || req.socket?.remoteAddress || '127.0.0.1')
    .trim()
    .replace(/^::ffff:/, '');
  return normalized === '::1' ? '127.0.0.1' : normalized;
};

module.exports = {
  VNPAY_VERSION,
  buildPaymentUrl,
  createSignature,
  formatVnpayDate,
  getClientIp,
  getConfig,
  verifySignature,
};

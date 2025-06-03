// Configuration settings for the application

// Load environment variables
const env = process.env;

export const config = {
  app: {
    port: Number(env.PORT) || 3000,
    nodeEnv: env.NODE_ENV || 'development',
  },
  db: {
    uri: env.MONGODB_URI || 'mongodb://localhost:27017/payment-request-system',
  },
  jwt: {
    secret: env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: env.JWT_EXPIRES_IN || '7d',
  },
  paymentGateways: {
    vnpay: {
      merchantId: env.VNPAY_MERCHANT_ID || 'test-merchant-id',
      secureHash: env.VNPAY_SECURE_HASH || 'test-secure-hash',
    },
    momo: {
      partnerCode: env.MOMO_PARTNER_CODE || 'test-partner-code',
      accessKey: env.MOMO_ACCESS_KEY || 'test-access-key',
      secretKey: env.MOMO_SECRET_KEY || 'test-secret-key',
    },
    zalopay: {
      appId: env.ZALOPAY_APP_ID || 'test-app-id',
      key1: env.ZALOPAY_KEY1 || 'test-key1',
      key2: env.ZALOPAY_KEY2 || 'test-key2',
    },
  },
};


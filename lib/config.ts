// Lemon Squeezy Configuration
export const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY || '';
export const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID || '';
export const LEMON_SQUEEZY_VARIANT_ID = process.env.LEMON_SQUEEZY_VARIANT_ID || '';
export const LEMON_SQUEEZY_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';

// Default Limits
export const DEFAULT_LIMITS = {
  FREE_TOKENS: 5000,
  FREE_STORAGE_BYTES: 5 * 1024 * 1024, // 5MB
} as const;

// Pricing Configuration
export const PRICING = {
  TOKENS_PER_DOLLAR: 1000,  // $1 per 1k tokens
  STORAGE_MB_PER_DOLLAR: 500,  // $1 per 500MB storage
} as const;

// Calculate pricing
export function calculateTokenCost(tokens: number): number {
  return Math.ceil(tokens / PRICING.TOKENS_PER_DOLLAR);
}

export function calculateStorageCost(storageBytes: number): number {
  const storageMB = storageBytes / (1024 * 1024);
  return Math.ceil(storageMB / PRICING.STORAGE_MB_PER_DOLLAR);
}

export function calculateTotalCost(tokens: number, storageBytes: number): number {
  return calculateTokenCost(tokens) + calculateStorageCost(storageBytes);
}

// Validate environment variables
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Only check in production to avoid development warnings
  const requiredEnvVars = [
    'LEMON_SQUEEZY_API_KEY',
    'LEMON_SQUEEZY_STORE_ID', 
    'LEMON_SQUEEZY_VARIANT_ID',
    'LEMON_SQUEEZY_WEBHOOK_SECRET',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
    }
  }
}
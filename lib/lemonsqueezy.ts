import { 
  lemonSqueezySetup,
  createCheckout,
  getStore,
  getVariant,
  type CheckoutOptions,
  type NewCheckout 
} from '@lemonsqueezy/lemonsqueezy.js';

import { 
  LEMON_SQUEEZY_API_KEY,
  LEMON_SQUEEZY_STORE_ID,
  LEMON_SQUEEZY_VARIANT_ID,
  calculateTotalCost,
  PRICING
} from './config';

// Initialize Lemon Squeezy
if (LEMON_SQUEEZY_API_KEY) {
  lemonSqueezySetup({
    apiKey: LEMON_SQUEEZY_API_KEY,
  });
}

export interface CheckoutData {
  tokens: number;
  storage: number; // in MB
  userId: string;
}

export interface CheckoutResult {
  checkout_url: string;
  checkout_id: string;
  summary: {
    tokens: number;
    storage_mb: number;
    token_cost: number;
    storage_cost: number;
    total_cost: number;
  };
}

/**
 * Create a Lemon Squeezy checkout for custom tokens and storage
 */
export async function createTokenStorageCheckout(data: CheckoutData): Promise<CheckoutResult> {
  // Check if Lemon Squeezy is configured
  if (!LEMON_SQUEEZY_API_KEY || !LEMON_SQUEEZY_STORE_ID || !LEMON_SQUEEZY_VARIANT_ID) {
    throw new Error("Lemon Squeezy is not configured. Please set up the required environment variables.");
  }

  const { tokens, storage, userId } = data;
  
  // Validate inputs
  if (tokens < PRICING.TOKENS_PER_DOLLAR || tokens > 100000) {
    throw new Error(`Tokens must be between ${PRICING.TOKENS_PER_DOLLAR.toLocaleString()} and 100,000`);
  }
  
  if (storage < 0 || storage > 10240) { // 10GB in MB
    throw new Error("Storage must be between 0 and 10GB");
  }

  // Calculate costs
  const tokenCost = Math.ceil(tokens / PRICING.TOKENS_PER_DOLLAR);
  const storageCost = Math.ceil(storage / PRICING.STORAGE_MB_PER_DOLLAR);
  const totalCost = tokenCost + storageCost;

  if (totalCost === 0) {
    throw new Error("Total cost cannot be $0");
  }

  // Create checkout options
  const checkoutOptions: CheckoutOptions = {
    productOptions: {
      name: `TalkPDF Credits: ${tokens.toLocaleString()} tokens + ${storage}MB storage`,
      description: `${tokens.toLocaleString()} tokens ($${tokenCost}) + ${storage}MB storage ($${storageCost})`,
    },
    checkoutOptions: {
      custom: {
        user_id: userId,
        tokens: tokens.toString(),
        storage_mb: storage.toString(),
        token_cost: tokenCost.toString(),
        storage_cost: storageCost.toString(),
        total_cost: totalCost.toString(),
      },
      // Enable discount codes
      discountAnchor: true,
    },
    checkoutData: {
      // Set custom price in cents
      customPrice: totalCost * 100, // Convert dollars to cents
      discountCode: "",
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    // Success/Cancel URLs will be set in the checkout creation
  };

  try {
    // Create the checkout
    const checkout = await createCheckout(LEMON_SQUEEZY_STORE_ID, LEMON_SQUEEZY_VARIANT_ID, checkoutOptions);
    
    if (checkout.error) {
      console.error('Lemon Squeezy checkout error:', checkout.error);
      throw new Error(`Checkout creation failed: ${checkout.error.message || 'Unknown error'}`);
    }

    if (!checkout.data || !checkout.data.attributes) {
      throw new Error('Invalid checkout response from Lemon Squeezy');
    }

    const checkoutUrl = checkout.data.attributes.url;
    const checkoutId = checkout.data.id;

    if (!checkoutUrl) {
      throw new Error('No checkout URL returned from Lemon Squeezy');
    }

    return {
      checkout_url: checkoutUrl,
      checkout_id: checkoutId,
      summary: {
        tokens,
        storage_mb: storage,
        token_cost: tokenCost,
        storage_cost: storageCost,
        total_cost: totalCost,
      },
    };

  } catch (error) {
    console.error('Error creating Lemon Squeezy checkout:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const expectedSignature = hmac.digest('hex');
    
    // Compare signatures securely
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Parse webhook event data
 */
export interface WebhookEventData {
  event_name: string;
  custom_data: {
    user_id: string;
    tokens: string;
    storage_mb: string;
    token_cost: string;
    storage_cost: string;
    total_cost: string;
  };
  order_id: string;
  checkout_id: string;
  customer_email: string;
  total_formatted: string;
}

export function parseWebhookEvent(eventData: any): WebhookEventData | null {
  try {
    // Validate required fields
    if (!eventData.data || !eventData.data.attributes) {
      console.error('Invalid webhook event structure');
      return null;
    }

    const attributes = eventData.data.attributes;
    const customData = attributes.custom_data || {};

    // Check if this is an order-related event
    if (!['order_created', 'order_refunded'].includes(eventData.meta?.event_name)) {
      console.log('Ignoring non-order webhook event:', eventData.meta?.event_name);
      return null;
    }

    return {
      event_name: eventData.meta.event_name,
      custom_data: {
        user_id: customData.user_id || '',
        tokens: customData.tokens || '0',
        storage_mb: customData.storage_mb || '0',
        token_cost: customData.token_cost || '0',
        storage_cost: customData.storage_cost || '0',
        total_cost: customData.total_cost || '0',
      },
      order_id: attributes.identifier || '',
      checkout_id: attributes.checkout_id || '',
      customer_email: attributes.user_email || '',
      total_formatted: attributes.total_formatted || '',
    };

  } catch (error) {
    console.error('Error parsing webhook event:', error);
    return null;
  }
}

/**
 * Validate store and variant configuration
 */
export async function validateLemonSqueezyConfig(): Promise<boolean> {
  try {
    // Check if store exists and is accessible
    const store = await getStore(LEMON_SQUEEZY_STORE_ID);
    if (store.error || !store.data) {
      console.error('Invalid Lemon Squeezy store ID:', store.error);
      return false;
    }

    // Check if variant exists and is accessible
    const variant = await getVariant(LEMON_SQUEEZY_VARIANT_ID);
    if (variant.error || !variant.data) {
      console.error('Invalid Lemon Squeezy variant ID:', variant.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating Lemon Squeezy config:', error);
    return false;
  }
}
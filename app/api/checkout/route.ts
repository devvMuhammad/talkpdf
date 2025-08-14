import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createTokenStorageCheckout } from '@/lib/lemonsqueezy';
import { z } from 'zod';
import { PRICING } from '@/lib/config';

const checkoutRequestSchema = z.object({
  tokens: z.number().min(PRICING.TOKENS_PER_DOLLAR, `Minimum ${PRICING.TOKENS_PER_DOLLAR.toLocaleString()} tokens`).max(100000, 'Maximum 100,000 tokens'),
  storage: z.number().min(0, 'Storage cannot be negative').max(10240, 'Maximum 10GB storage'), // in MB
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = checkoutRequestSchema.parse(body);
    const { tokens, storage } = validatedData;

    // Create Lemon Squeezy checkout
    const checkoutResult = await createTokenStorageCheckout({
      tokens,
      storage,
      userId,
    });

    return NextResponse.json({
      success: true,
      checkout_url: checkoutResult.checkout_url,
      checkout_id: checkoutResult.checkout_id,
      summary: checkoutResult.summary,
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({
        error: 'Checkout creation failed',
        message: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      error: 'Internal server error',
    }, { status: 500 });
  }
}
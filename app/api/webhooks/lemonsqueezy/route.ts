import { NextRequest, NextResponse } from 'next/server';
import { parseWebhookEvent, verifyWebhookSignature, type WebhookEventData } from '@/lib/lemonsqueezy';
import { LEMON_SQUEEZY_WEBHOOK_SECRET } from '@/lib/config';
import { fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';


export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('x-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, LEMON_SQUEEZY_WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook event
    const eventData = JSON.parse(body);
    const event = parseWebhookEvent(eventData);
    
    if (!event) {
      console.log('Ignoring non-order webhook event or invalid event data');
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    console.log('Received webhook event:', event.event_name);

    // Handle completed payments
    if (event.event_name === 'order_created') {
      const { custom_data } = event;
      
      if (!custom_data.user_id) {
        console.error('Missing user_id in webhook event');
        return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
      }

      const tokens = parseInt(custom_data.tokens);
      const storageMB = parseInt(custom_data.storage_mb);

      console.log('Processing payment completion:', {
        userId: custom_data.user_id,
        tokens,
        storageMB,
        totalCost: custom_data.total_cost,
      });

      try {
        // Update user limits using the existing upgradeUser function
        const result = await fetchMutation(api.billing.upgradeUser, {
          userId: custom_data.user_id,
          tokensToAdd: tokens,
          storageToAdd: storageMB * 1024 * 1024, // Convert MB to bytes
          subscriptionType: 'paid',
        });

        console.log('Successfully upgraded user:', result);
        
        return NextResponse.json({ 
          success: true,
          message: 'Payment processed successfully',
          upgraded: {
            tokens,
            storage: storageMB,
            cost: custom_data.total_cost,
          }
        });

      } catch (error) {
        console.error('Failed to upgrade user after payment:', error);
        
        // This is critical - the payment went through but we failed to upgrade the user
        // You might want to implement a retry mechanism or manual intervention here
        return NextResponse.json({ 
          error: 'Payment received but upgrade failed',
          userId: custom_data.user_id,
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Handle refunds
    if (event.event_name === 'order_refunded') {
      console.log('Order refunded:', event.order_id);
      // TODO: Handle refund logic if needed
      // You might want to reduce user limits here
    }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed',
      event: event.event_name,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
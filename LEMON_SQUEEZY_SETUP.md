# Lemon Squeezy Integration Setup Guide

This guide will help you set up Lemon Squeezy for TalkPDF's pay-as-you-go billing system.

## Overview

The integration provides:
- **$1 per 1,000 tokens** - for AI conversations and file processing
- **$1 per 500MB storage** - for PDF file storage
- **No subscription packages** - users pay exactly for what they want
- **Real-time credit updates** via webhooks

## 1. Lemon Squeezy Account Setup

### Create Account & Store
1. Sign up at [lemonsqueezy.com](https://lemonsqueezy.com)
2. Create a new store
3. Note your **Store ID** (found in Settings > General)

### Create Product & Variant
1. Go to Products → New Product
2. Create a product called "TalkPDF Credits"
3. Set it as a **one-time purchase**
4. Create a variant with **variable pricing** (let customers enter amount)
5. Note your **Variant ID** (found in the variant details)

### Get API Keys
1. Go to Settings → API
2. Create a new API key with full permissions
3. Note your **API Key**

### Setup Webhooks
1. Go to Settings → Webhooks
2. Add webhook endpoint: `https://yourdomain.com/api/webhooks/lemonsqueezy`
3. Select events: `order_created`, `order_refunded`, `subscription_payment_failed`
4. Note your **Webhook Secret**

## 2. Environment Variables

Add these to your `.env.local` file:

```env
# Lemon Squeezy Configuration
LEMON_SQUEEZY_API_KEY=your_api_key_here
LEMON_SQUEEZY_STORE_ID=your_store_id_here
LEMON_SQUEEZY_VARIANT_ID=your_variant_id_here
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # or http://localhost:3000 for dev
```

## 3. Testing the Integration

### Local Development Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Use ngrok for webhook testing:**
   ```bash
   # Install ngrok if you haven't
   npm install -g ngrok
   
   # Expose local server
   ngrok http 3000
   
   # Update webhook URL in Lemon Squeezy dashboard to:
   # https://your-ngrok-url.ngrok.io/api/webhooks/lemonsqueezy
   ```

3. **Test the checkout flow:**
   - Navigate to `/chat`
   - Click "Upgrade" in the usage panel
   - Enter desired tokens/storage
   - Click "Pay with Lemon Squeezy"
   - Complete test payment in Lemon Squeezy

### Production Testing

1. **Deploy your application**
2. **Update webhook URL** to your production domain
3. **Set `NODE_ENV=production`** to disable test mode
4. **Test with real payments** (small amounts first)

## 4. Webhook Events Flow

```
1. User clicks "Pay with Lemon Squeezy"
2. Checkout session created via /api/checkout
3. User redirected to Lemon Squeezy checkout
4. User completes payment
5. Lemon Squeezy sends webhook to /api/webhooks/lemonsqueezy
6. Webhook verifies signature and processes payment
7. User credits updated via convex/billing.ts upgradeUser
8. User redirected back to /chat?payment=success
9. Success toast displayed and URL cleaned up
```

## 5. Troubleshooting

### Common Issues

**Webhook signature verification fails:**
- Ensure `LEMON_SQUEEZY_WEBHOOK_SECRET` matches dashboard
- Check webhook URL is correct and accessible

**Checkout creation fails:**
- Verify all environment variables are set
- Check Store ID and Variant ID are correct
- Ensure API key has proper permissions

**Credits not updating after payment:**
- Check webhook logs in Lemon Squeezy dashboard
- Verify webhook endpoint is responding with 200
- Check server logs for convex mutation errors

### Debug Webhook Issues

1. **Check webhook logs** in Lemon Squeezy dashboard
2. **Add logging** to webhook handler:
   ```javascript
   console.log('Webhook received:', {
     event: event.meta.event_name,
     customData: event.meta.custom_data,
   });
   ```
3. **Test webhook manually** with tools like Postman
4. **Use webhook testing tools** like webhook.site

### API Endpoint Testing

Test the checkout endpoint directly:

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "tokens": 5000,
    "storage": 1000
  }'
```

## 6. Monitoring & Analytics

### Key Metrics to Track
- Conversion rate (checkout views vs completions)
- Average order value
- Failed payment rate
- Time to credit update after payment

### Lemon Squeezy Dashboard
- Monitor sales and revenue
- Track customer behavior
- View webhook delivery status
- Analyze payment success rates

## 7. Security Considerations

- **Webhook signatures** are verified before processing
- **User authentication** required for all billing operations
- **Environment variables** never exposed to client
- **HTTPS required** for webhook endpoints in production
- **Rate limiting** recommended for API endpoints

## 8. Future Enhancements

Consider implementing:
- **Email receipts** after successful payments
- **Payment retry logic** for failed webhooks
- **Refund handling** via additional webhook events
- **Usage analytics** and spending insights
- **Bulk credit packages** with discounts
- **Subscription options** for heavy users

---

For support, check:
- [Lemon Squeezy Documentation](https://docs.lemonsqueezy.com)
- [Lemon Squeezy API Reference](https://docs.lemonsqueezy.com/api)
- TalkPDF logs at `/api/webhooks/lemonsqueezy` endpoint
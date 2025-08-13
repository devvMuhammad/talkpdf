import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { z } from "zod";

const upgradeSchema = z.object({
  tokensToAdd: z.number().min(1000).max(100000), // Between 1k and 100k tokens
  storageToAdd: z.number().min(0).max(10 * 1024 * 1024 * 1024), // Up to 10GB
  subscriptionType: z.enum(["free", "paid"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tokensToAdd, storageToAdd, subscriptionType } = upgradeSchema.parse(body);

    // Calculate pricing (simplified - in real app you'd integrate with Stripe)
    const tokenCost = Math.ceil(tokensToAdd / 1000) * 1; // $1 per 1k tokens
    const storageCost = Math.ceil(storageToAdd / (500 * 1024 * 1024)) * 1; // $1 per 500MB
    const totalCost = tokenCost + storageCost;

    // In a real implementation, you would:
    // 1. Create a Stripe payment intent
    // 2. Process the payment
    // 3. Only update limits after successful payment

    // For now, we'll just simulate the upgrade
    const currentBilling = await fetchQuery(api.billing.getUserBilling, { userId });

    if (!currentBilling) {
      return NextResponse.json({ error: "User billing not found" }, { status: 404 });
    }

    const newTokenLimit = currentBilling.tokensLimit + tokensToAdd;
    const newStorageLimit = currentBilling.storageLimit + storageToAdd;

    await fetchMutation(api.billing.updateUserLimits, {
      userId,
      tokensLimit: newTokenLimit,
      storageLimit: newStorageLimit,
      subscriptionType,
    });

    return NextResponse.json({
      success: true,
      cost: totalCost,
      newLimits: {
        tokens: newTokenLimit,
        storage: newStorageLimit,
      },
    });
  } catch (error) {
    console.error("Error processing upgrade:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid upgrade data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process upgrade" },
      { status: 500 }
    );
  }
}
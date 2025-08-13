import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user billing data
    const billing = await fetchQuery(api.billing.getUserBilling, { userId });

    if (!billing) {
      // Initialize billing for new users
      await fetchMutation(api.billing.initializeUserBilling, { userId });
      const newBilling = await fetchQuery(api.billing.getUserBilling, { userId });
      return NextResponse.json(newBilling);
    }

    return NextResponse.json(billing);
  } catch (error) {
    console.error("Error getting user billing:", error);
    return NextResponse.json(
      { error: "Failed to get user billing data" },
      { status: 500 }
    );
  }
}
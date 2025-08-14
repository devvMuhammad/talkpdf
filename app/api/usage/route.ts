import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (type === "tokens") {
      // Fetch token transactions
      const transactions = await convex.query(api.billing.getTokenTransactions, {
        userId,
        limit,
        offset,
      });
      
      return NextResponse.json({ transactions });
    } else if (type === "storage") {
      // Fetch storage transactions
      const transactions = await convex.query(api.billing.getStorageTransactions, {
        userId,
        limit,
        offset,
      });
      
      return NextResponse.json({ transactions });
    } else {
      return NextResponse.json({ error: "Invalid type parameter. Use 'tokens' or 'storage'" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching usage data:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
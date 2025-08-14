import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PRICING } from "@/lib/config";

export interface BillingData {
  _id: Id<"userBilling">;
  userId: string;
  tokensUsed: number;
  tokensLimit: number;
  storageUsed: number;
  storageLimit: number;
  subscriptionType: "free" | "paid";
  subscriptionStatus: "active" | "cancelled" | "expired";
  nextResetDate?: number;
  lastUpdated: number;
  createdAt: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  error?: string;
  errorCode?: number;
  details?: {
    needed: number;
    available: number;
    currentUsage: number;
    limit: number;
  };
}

/**
 * Get or initialize user billing data
 */
export async function ensureUserBilling(userId: string): Promise<BillingData | null> {
  let billing = await fetchQuery(api.billing.getUserBilling, { userId });

  if (!billing) {
    // Initialize billing for new users
    await fetchMutation(api.billing.initializeUserBilling, { userId });
    billing = await fetchQuery(api.billing.getUserBilling, { userId });
  }

  return billing;
}

/**
 * Check if user has enough tokens for an operation
 */
export async function checkTokenLimit(
  userId: string,
  tokensNeeded: number
): Promise<LimitCheckResult> {
  const billing = await ensureUserBilling(userId);

  if (!billing) {
    return {
      allowed: false,
      error: "Failed to check token limits",
      errorCode: 500
    };
  }

  const available = billing.tokensLimit - billing.tokensUsed;

  if (tokensNeeded > available) {
    return {
      allowed: false,
      error: "Insufficient tokens",
      errorCode: 429, // Too Many Requests
      details: {
        needed: tokensNeeded,
        available,
        currentUsage: billing.tokensUsed,
        limit: billing.tokensLimit
      }
    };
  }

  return { allowed: true };
}

/**
 * Check if user has enough storage for upload
 */
export async function checkStorageLimit(
  userId: string,
  bytesNeeded: number
): Promise<LimitCheckResult> {
  const billing = await ensureUserBilling(userId);

  if (!billing) {
    return {
      allowed: false,
      error: "Failed to check storage limits",
      errorCode: 500
    };
  }

  const available = billing.storageLimit - billing.storageUsed;

  if (bytesNeeded > available) {
    return {
      allowed: false,
      error: "Insufficient storage space",
      errorCode: 413, // Payload Too Large
      details: {
        needed: bytesNeeded,
        available,
        currentUsage: billing.storageUsed,
        limit: billing.storageLimit
      }
    };
  }

  return { allowed: true };
}

/**
 * Record token usage with error handling
 */
export async function recordTokens(
  userId: string,
  tokensUsed: number,
  operationType: "chat_message" | "file_processing" | "embedding_generation" | "query_embedding",
  options?: {
    conversationId?: Id<"conversations">;
    messageId?: Id<"messages">;
    description?: string;
    allowOverage?: boolean;
  }
): Promise<void> {
  try {
    await fetchMutation(api.billing.recordTokenUsage, {
      userId,
      tokensUsed,
      operationType,
      conversationId: options?.conversationId,
      messageId: options?.messageId,
      description: options?.description,
    });
    console.log(`Recorded ${tokensUsed} tokens for ${operationType}`);
  } catch (error) {
    console.error(`Error recording token usage for ${operationType}:`, error);
    // Don't throw - billing errors shouldn't break the main functionality
  }
}

/**
 * Record storage usage with error handling
 */
export async function recordStorage(
  userId: string,
  sizeBytes: number,
  operationType: "file_upload" | "file_delete",
  options?: {
    fileId?: Id<"files">;
    filename?: string;
  }
): Promise<void> {
  try {
    await fetchMutation(api.billing.recordStorageUsage, {
      userId,
      sizeBytes,
      operationType,
      fileId: options?.fileId,
      filename: options?.filename,
    });
    console.log(`Recorded storage usage for ${options?.filename || 'file'}: ${sizeBytes} bytes`);
  } catch (error) {
    console.error(`Error recording storage usage for ${options?.filename || 'file'}:`, error);
    // Don't throw - billing errors shouldn't break the main functionality
  }
}

/**
 * Estimate tokens needed for text processing
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~0.75 tokens per character for English text
  // This is conservative and accounts for tokenization overhead
  return Math.ceil(text.length * 0.75);
}

/**
 * Estimate tokens needed for file processing
 */
export function estimateFileProcessingTokens(fileCount: number, estimatedContentLength?: number): number {
  if (estimatedContentLength) {
    // If we have content length, use it for estimation
    return estimateTokens(estimatedContentLength.toString()) + (fileCount * 100); // Add overhead per file
  }

  // Conservative estimate per file for PDF processing
  // Assumes average PDF has ~5-10 pages with ~500-1000 chars per page
  return fileCount * PRICING.TOKENS_PER_DOLLAR;
}

/**
 * Format storage size for display
 */
export function formatStorage(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(0)}MB`;
  return `${(mb / 1024).toFixed(1)}GB`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Check if user is approaching token limit (85% threshold)
 */
export function isApproachingTokenLimit(billing: BillingData): boolean {
  const usagePercent = (billing.tokensUsed / billing.tokensLimit) * 100;
  return usagePercent >= 85 && billing.tokensUsed < billing.tokensLimit;
}

/**
 * Check if user is approaching storage limit (85% threshold)
 */
export function isApproachingStorageLimit(billing: BillingData): boolean {
  const usagePercent = (billing.storageUsed / billing.storageLimit) * 100;
  return usagePercent >= 85 && billing.storageUsed < billing.storageLimit;
}

/**
 * Check if user has exceeded token limit
 */
export function hasExceededTokenLimit(billing: BillingData): boolean {
  return billing.tokensUsed >= billing.tokensLimit;
}

/**
 * Check if user has exceeded storage limit
 */
export function hasExceededStorageLimit(billing: BillingData): boolean {
  return billing.storageUsed >= billing.storageLimit;
}

/**
 * Get remaining tokens
 */
export function getRemainingTokens(billing: BillingData): number {
  return Math.max(0, billing.tokensLimit - billing.tokensUsed);
}

/**
 * Get remaining storage
 */
export function getRemainingStorage(billing: BillingData): number {
  return Math.max(0, billing.storageLimit - billing.storageUsed);
}

/**
 * Create user-friendly error messages for limit violations
 */
export function createUserFriendlyErrorMessage(result: LimitCheckResult, limitType: 'tokens' | 'storage' = 'tokens'): string {
  if (!result.details) {
    return result.error || "Limit exceeded";
  }

  const { currentUsage, limit } = result.details;

  if (limitType === 'tokens') {
    return `Token limit exceeded. You've used ${formatNumber(currentUsage)} of your ${formatNumber(limit)} tokens. Upgrade to get more tokens.`;
  } else {
    return `Storage limit exceeded. You've used ${formatStorage(currentUsage)} of your ${formatStorage(limit)} storage limit. Upgrade to get more storage.`;
  }
}

/**
 * Create HTTP error response for limit violations
 */
export function createLimitErrorResponse(result: LimitCheckResult, limitType: 'tokens' | 'storage' = 'tokens'): Response {
  if (!result.error || !result.errorCode) {
    throw new Error("Invalid limit check result for error response");
  }

  const userFriendlyMessage = createUserFriendlyErrorMessage(result, limitType);

  const body = {
    error: userFriendlyMessage,
    originalError: result.error,
    limitType,
    actionRequired: "upgrade",
    ...(result.details && {
      needed: result.details.needed,
      available: result.details.available,
      currentUsage: result.details.currentUsage,
      limit: result.details.limit,
      shortage: Math.max(0, result.details.needed - result.details.available)
    })
  };

  return new Response(JSON.stringify(body), {
    status: result.errorCode,
    headers: { "Content-Type": "application/json" }
  });
}
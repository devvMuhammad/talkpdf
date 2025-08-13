import { encodingForModel, Tiktoken } from "js-tiktoken";
import { UIMessage } from "ai";

// Initialize encoding for GPT-4
let encoding: Tiktoken;

try {
  encoding = encodingForModel("gpt-4");
} catch (error) {
  console.warn("Failed to load GPT-4 encoding, falling back to cl100k_base");
  // Fallback to cl100k_base which is used by GPT-4
  const { get_encoding } = require("js-tiktoken");
  encoding = get_encoding("cl100k_base");
}

/**
 * Count tokens in a text string using tiktoken
 */
export function countTokens(text: string): number {
  if (!text || typeof text !== "string") {
    return 0;
  }

  try {
    return encoding.encode(text).length;
  } catch (error) {
    console.error("Error counting tokens:", error);
    // Fallback: rough estimation (1 token ≈ 4 characters for English)
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens in a UIMessage
 */
export function countMessageTokens(message: UIMessage): number {
  let totalTokens = 0;

  // Base tokens for message structure (role, etc.)
  totalTokens += 4; // Rough estimate for message overhead

  // Count tokens in each part
  for (const part of message.parts) {
    if (part.type === "text" && part.text) {
      totalTokens += countTokens(part.text);
    } else if (part.type === "file" && part.filename) {
      // Add small token cost for file references
      totalTokens += countTokens(`File: ${part.filename}`);
    }
  }

  return totalTokens;
}

/**
 * Count tokens in an array of UIMessages
 */
export function countMessagesTokens(messages: UIMessage[]): number {
  return messages.reduce((total, message) => total + countMessageTokens(message), 0);
}

/**
 * Count tokens in the system prompt and messages for a complete conversation
 */
export function countConversationTokens(
  messages: UIMessage[],
  systemPrompt?: string
): number {
  let totalTokens = 0;

  // Count system prompt tokens
  if (systemPrompt) {
    totalTokens += countTokens(systemPrompt);
    totalTokens += 4; // System message overhead
  }

  // Count all message tokens
  totalTokens += countMessagesTokens(messages);

  // Add some buffer for completion tokens (response)
  // This is an estimate since we don't know the response length in advance
  totalTokens += 100; // Conservative estimate for response overhead

  return totalTokens;
}

/**
 * Estimate response tokens (for budgeting purposes)
 * This is a rough estimate since we can't know the exact response length
 */
export function estimateResponseTokens(inputTokens: number): number {
  // Rough heuristic: response is usually 10-30% of input length for Q&A
  // Cap it at reasonable bounds
  const estimate = Math.max(50, Math.min(inputTokens * 0.2, 1000));
  return Math.ceil(estimate);
}

/**
 * Calculate total estimated tokens for a conversation turn
 * (input + estimated response)
 */
export function estimateTotalTokensForTurn(
  messages: UIMessage[],
  systemPrompt?: string
): number {
  const inputTokens = countConversationTokens(messages, systemPrompt);
  const responseTokens = estimateResponseTokens(inputTokens);
  return inputTokens + responseTokens;
}
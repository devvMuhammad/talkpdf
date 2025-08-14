import { OpenAIEmbeddings } from "@langchain/openai"
import { Pinecone } from '@pinecone-database/pinecone'
import { api } from "@/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { Id } from "@/convex/_generated/dataModel"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { OpenAI } from "openai"
import { recordTokens } from "@/lib/billing-utils"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

// Initialize OpenAI embeddings (same config as indexing)
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "text-embedding-3-small",
  dimensions: 512
})

interface RetrievedDocument {
  text: string
  fileName: string
  source: string
  score: number
}

interface ConversationMessage {
  role: "user" | "assistant" | "system"
  parts: Array<{
    type: string
    text?: string
    mediaType?: string
    filename?: string
    url?: string
  }>
  createdAt: string
}

/**
 * Generate embedding for a user query with token tracking
 */
export async function generateQueryEmbedding(query: string, userId?: string): Promise<number[]> {
  try {
    // Use OpenAI client directly to get usage information
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 512,
    });

    // Record token usage if userId is provided
    if (userId && response.usage) {
      await recordTokens(userId, response.usage.total_tokens, "query_embedding", {
        description: "Query embedding generation",
      });
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating query embedding:", error)
    throw new Error("Failed to generate embedding for query")
  }
}

/**
 * Search Pinecone for relevant document chunks
 */
export async function searchRelevantDocuments(
  userId: string,
  queryEmbedding: number[],
  topK: number = 5,
  conversationId?: string
): Promise<RetrievedDocument[]> {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME!
    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME environment variable is required')
    }

    const index = pinecone.index(indexName)
    const namespace = `user-${userId}`

    // Build filter object for conversation ID if provided
    const filter = conversationId ? { conversationId } : undefined

    const searchResults = await index.namespace(namespace).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      includeValues: false,
      filter
    })

    const documents: RetrievedDocument[] = searchResults.matches.map((match) => ({
      text: match.metadata?.text as string || "",
      fileName: match.metadata?.fileName as string || "Unknown",
      source: match.metadata?.source as string || "",
      score: match.score || 0
    }))

    return documents.filter(doc => doc.text.trim().length > 0)
  } catch (error) {
    console.error("Error searching Pinecone:", error)
    throw new Error("Failed to search for relevant documents")
  }
}

/**
 * Get the last N messages from a conversation
 */
export async function getRecentMessages(
  conversationId: Id<"conversations">,
  limit: number = 5
): Promise<ConversationMessage[]> {
  try {
    const conversation = await fetchQuery(api.conversations.getById, {
      id: conversationId
    })

    if (!conversation || !conversation.messages) {
      return []
    }

    // Get the last N messages, excluding the current user message
    const recentMessages = conversation.messages
      .slice(-limit - 1, -1) // Exclude the last message (current user message)
      .map(msg => ({
        role: msg.role,
        parts: msg.parts,
        createdAt: msg.createdAt
      }))

    return recentMessages
  } catch (error) {
    console.error("Error fetching recent messages:", error)
    return []
  }
}

/**
 * Extract text content from message parts
 */
export function extractTextFromMessages(messages: ConversationMessage[]): string {
  return messages
    .map(msg => {
      const textParts = msg.parts
        .filter(part => part.type === "text" && part.text)
        .map(part => `${msg.role}: ${part.text}`)
        .join("\n")
      return textParts
    })
    .filter(text => text.length > 0)
    .join("\n")
}

/**
 * Format retrieved documents for context
 */
export function formatDocumentsForContext(documents: RetrievedDocument[]): string {
  if (documents.length === 0) {
    return "No relevant documents found."
  }

  return documents
    .map((doc, index) => {
      return `Document ${index + 1} (from ${doc.fileName}, relevance: ${(doc.score * 100).toFixed(1)}%):\n${doc.text}`
    })
    .join("\n\n---\n\n")
}

/**
 * RAG Prompt Template for PDF Q&A
 */
export const ragPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", `You are TalkPDF, an AI assistant specialized in analyzing and answering questions about PDF documents. You have access to relevant document excerpts and conversation history to provide accurate, contextual responses.

INSTRUCTIONS:
1. Use the provided DOCUMENT CONTEXT to answer questions accurately
2. Consider the CONVERSATION HISTORY for context and continuity  
3. If the answer isn't in the documents, clearly state that
4. Quote specific parts of documents when relevant
5. Maintain conversational flow while being precise
6. If documents contradict each other, mention this
7. For calculations or data analysis, show your work

RESPONSE GUIDELINES:
- Be conversational but accurate
- Use markdown formatting for clarity
- Quote document sources when making specific claims
- If information is missing, suggest what additional context might help
- Maintain awareness of the ongoing conversation context`],

  ["user", `DOCUMENT CONTEXT:
{context}

RECENT CONVERSATION HISTORY:
{conversationHistory}

CURRENT QUESTION: {question}

Please provide a helpful and accurate response based on the document context and conversation history.`]
])

/**
 * Create RAG prompt with context
 */
export async function createRAGPrompt(
  question: string,
  documents: RetrievedDocument[],
  conversationHistory: string
): Promise<string> {
  const context = formatDocumentsForContext(documents)

  const formattedPrompt = await ragPromptTemplate.format({
    context,
    conversationHistory: conversationHistory || "No previous conversation.",
    question
  })

  return formattedPrompt
}
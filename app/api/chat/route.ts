import { streamText, UIMessage } from "ai"
import { openai } from "@ai-sdk/openai";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import { checkTokenLimit, recordTokens, createLimitErrorResponse } from "@/lib/billing-utils";
import {
  generateQueryEmbedding,
  searchRelevantDocuments,
  createRAGPrompt
} from "@/lib/rag-utils";

const systemPrompt = `
You are a highly skilled AI assistant specialized in reading, understanding, and extracting information from PDFs. You can process both text-based and scanned PDFs, interpret charts, tables, images (when possible), and provide clear, well-structured answers. You should maintain accuracy, context awareness, and avoid making assumptions without evidence from the document.`

// const promptTemplate = ChatPromptTemplate.fromMessages([
//   ["system", systemPrompt],
//   ["user", "{input}"],
// ])

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Check user's token limits before processing
    const estimatedTokensNeeded = 1000; // Conservative estimate for chat response
    const tokenCheck = await checkTokenLimit(userId, estimatedTokensNeeded);
    if (!tokenCheck.allowed) {
      return createLimitErrorResponse(tokenCheck, 'tokens');
    }

    const { messages, conversationId } = await req.json() as {
      messages: UIMessage[],
      conversationId: Id<"conversations">
    }

    // Get the latest user message
    const latestMessage = messages.at(-1)
    if (!latestMessage) {
      return new Response("No messages provided", { status: 400 })
    }

    // Extract text from the latest message
    const userQuestion = latestMessage.parts
      .filter(part => part.type === "text" && "text" in part && part.text)
      .map(part => (part as any).text)
      .join(" ")

    if (!userQuestion.trim()) {
      return new Response("No text content in message", { status: 400 })
    }

    let ragPrompt = systemPrompt
    let documentsFound = 0

    try {
      // Generate embedding for the user question
      console.log("Generating embedding for query:", userQuestion)
      const queryEmbedding = await generateQueryEmbedding(userQuestion, userId)

      // Search for relevant documents
      console.log("Searching for relevant documents...")
      const relevantDocuments = await searchRelevantDocuments(userId, queryEmbedding, 10)
      documentsFound = relevantDocuments.length

      // Get recent conversation history
      console.log("Fetching recent conversation history...")
      const recentMessages = messages.slice(0, 6)
      // get the text from the recent messages
      const conversationHistory = recentMessages.map(m => m.parts.map(p => p.type === "text" && "text" in p ? (p as any).text : "").join(" "))

      // Create RAG prompt if we have relevant documents
      if (relevantDocuments.length > 0) {
        console.log(`Found ${relevantDocuments.length} relevant document chunks`)
        ragPrompt = await createRAGPrompt(userQuestion, relevantDocuments, conversationHistory.join("\n"))
      } else {
        console.log("No relevant documents found, falling back to general conversation")
        ragPrompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nNote: No relevant documents were found for this query. Please respond based on general knowledge while acknowledging that you don't have access to specific document content for this question.`
      }

    } catch (ragError) {
      console.error("RAG pipeline error:", ragError)
      // Fall back to basic conversation without RAG
      ragPrompt = `${systemPrompt}\n\nNote: There was an issue accessing document context. Please respond based on general knowledge.`
    }

    // Create the conversation with RAG context
    const result = streamText({
      model: openai("chatgpt-4o-latest"),
      prompt: `${ragPrompt}\n\nUser: ${userQuestion}`,
    })


    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onError(error) {
        console.error("Streaming error:", error)
        return error instanceof Error ? error.message : "An error occurred during response generation"
      },
      onFinish: async ({ responseMessage }) => {
        if (!responseMessage) return;

        const userMessage = messages.at(-1)

        const messagesToSave = [userMessage, responseMessage].filter(m => m !== undefined).map(m => ({
          role: m.role,
          parts: m.parts.map(p => ({
            type: p.type,
            text: p.type === "text" ? p.text : undefined,
            mediaType: p.type === "file" ? p.mediaType : undefined,
            filename: p.type === "file" ? p.filename : undefined,
            url: p.type === "file" ? p.url : undefined,
          })),
          createdAt: Date.now(),
        }))

        // Save messages to database
        await fetchMutation(api.conversations.addMessages, {
          conversationId,
          messages: messagesToSave,
        })

        // Record token usage
        try {
          const usage = await result.usage;
          await recordTokens(userId, usage.totalTokens || 0, "chat_message", {
            conversationId,
            description: `Chat response with ${documentsFound} documents used`,
          })
        } catch (tokenError) {
          console.error("Error getting token usage:", tokenError);
        }

        console.log(`RAG response completed. Documents used: ${documentsFound}`)
      }
    })

  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
} 

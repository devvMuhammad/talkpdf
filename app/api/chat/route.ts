import { convertToModelMessages, ModelMessage, streamText, UIMessage } from "ai"
import { openai } from "@ai-sdk/openai";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";

const systemPrompt = `
You are a highly skilled AI assistant specialized in reading, understanding, and extracting information from PDFs. You can process both text-based and scanned PDFs, interpret charts, tables, images (when possible), and provide clear, well-structured answers. You should maintain accuracy, context awareness, and avoid making assumptions without evidence from the document.`

// const promptTemplate = ChatPromptTemplate.fromMessages([
//   ["system", systemPrompt],
//   ["user", "{input}"],
// ])

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json() as { messages: UIMessage[], conversationId: Id<"conversations"> }


  const result = streamText({
    model: openai("chatgpt-4o-latest"),
    system: systemPrompt,
    prompt: convertToModelMessages(messages),
  })


  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onError(error) {
      console.error("ERROR WHILE STREAMING LOL", error)
      return error instanceof Error ? error.message : "An error occurred"
    },
    onFinish: async ({ responseMessage }) => {
      if (!responseMessage) return;

      const userMessage = messages.at(-1)

      const messagesToSave = [userMessage, responseMessage].filter(m => m !== undefined).map(m => ({
        role: m.role,
        content: m.parts.map(p => p.type === "text" ? p.text : "").join(""),
        createdAt: Date.now(),
      }))

      // save both
      await fetchMutation(api.conversations.addMessages, {
        conversationId,
        messages: messagesToSave,
      })
    }
  })
} 

import { convertToModelMessages, ModelMessage, streamText } from "ai"
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { openai } from "@ai-sdk/openai";
import { BookDashed } from "lucide-react";

const systemPrompt = `
You are a highly skilled AI assistant specialized in reading, understanding, and extracting information from PDFs. You can process both text-based and scanned PDFs, interpret charts, tables, images (when possible), and provide clear, well-structured answers. You should maintain accuracy, context awareness, and avoid making assumptions without evidence from the document.`

// const promptTemplate = ChatPromptTemplate.fromMessages([
//   ["system", systemPrompt],
//   ["user", "{input}"],
// ])

export async function POST(req: Request) {
  const { messages } = await req.json()


  const result = streamText({
    model: openai("chatgpt-4o-latest"),
    system: systemPrompt,
    prompt: convertToModelMessages(messages),
  })


  return result.toUIMessageStreamResponse()
} 

import { ModelMessage } from "ai"
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";


const systemPrompt = `
You are a highly skilled AI assistant specialized in reading, understanding, and extracting information from PDFs. You can process both text-based and scanned PDFs, interpret charts, tables, images (when possible), and provide clear, well-structured answers. You should maintain accuracy, context awareness, and avoid making assumptions without evidence from the document.`

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["user", "{input}"],
])

export async function POST(req: Request) {
  const body = await req.json()

  console.log("REQUEST BODY", body)

  let model = new ChatOpenAI({
    model: "chatgpt-4o-latest",
    temperature: 0.5,
    maxTokens: 1000,
  })

  const chain = promptTemplate.pipe(model)

  // const chain = model.invoke(promptTemplate)

  const result = await chain.invoke({ input: body.text })

  return Response.json(result)
} 

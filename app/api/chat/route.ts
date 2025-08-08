import { type CoreMessage, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"

export async function POST(req: Request) {
  const { messages, model }: { messages: CoreMessage[]; model?: string } = await req.json()

  let selectedModel
  const modelId = model || "gpt-4o-mini"

  if (modelId.startsWith("gpt")) {
    selectedModel = openai(modelId)
  } else if (modelId.startsWith("claude")) {
    selectedModel = anthropic(modelId)
  } else if (modelId.startsWith("gemini")) {
    selectedModel = google(modelId)
  } else {
    selectedModel = openai("gpt-4o-mini") // fallback
  }

  const result = streamText({
    model: selectedModel,
    system: "You are a helpful assistant.",
    messages,
  })

  return result.toDataStreamResponse()
}

import { streamText, tool, UIMessage } from "ai"
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
import z from "zod";

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
      return new Response(JSON.stringify({
        error: "Unauthorized",
        message: "Please sign in to continue"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const tokenCheck = await checkTokenLimit(userId, 0);
    console.log("tokenCheck", tokenCheck)
    if (!tokenCheck.allowed) {
      return createLimitErrorResponse(tokenCheck, 'tokens');
    }

    const { messages, conversationId } = await req.json() as {
      messages: UIMessage[],
      conversationId: Id<"conversations">
    }


    // Get the latest user message
    const latestMessage = messages.at(-1)
    console.log("LATEST MESSAGE", latestMessage)
    if (!latestMessage) {
      return new Response(JSON.stringify({
        error: "Invalid request",
        message: "No messages provided"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Extract text from the latest message
    const userQuestion = latestMessage.parts
      .filter(part => part.type === "text" && "text" in part && part.text)
      .map(part => (part as any).text)
      .join(" ")

    if (!userQuestion.trim()) {
      return new Response(JSON.stringify({
        error: "Invalid request",
        message: "Message must contain text content"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    let ragPrompt = systemPrompt
    let documentsFound = 0

    try {
      // Generate embedding for the user question
      console.log("Generating embedding for query:", userQuestion)
      const queryEmbedding = await generateQueryEmbedding(userQuestion, userId)

      // Search for relevant documents
      console.log("Searching for relevant documents...")
      const relevantDocuments = await searchRelevantDocuments(userId, queryEmbedding, 10, conversationId)
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
      model: openai("gpt-4"),
      prompt: `${ragPrompt}\n\nUser: ${userQuestion}`,
      tools: {
        weather: tool({
          description: "Get current weather information for a specific location",
          inputSchema: z.object({
            location: z.string().describe("The city name or location to get weather for (e.g., 'London', 'New York', 'Tokyo')"),
          }),
          execute: async ({ location }) => {
            try {
              const apiKey = process.env.OPENWEATHER_API_KEY;
              if (!apiKey) {
                return {
                  location,
                  temperature: 0,
                  feels_like: 0,
                  condition: "Unknown",
                  description: "Weather service unavailable",
                  humidity: 0,
                  wind_speed: 0,
                  icon: "01d",
                  error: "Weather API key not configured"
                };
              }

              const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
              );

              if (response.status === 404) {
                return {
                  location,
                  temperature: 0,
                  feels_like: 0,
                  condition: "Unknown",
                  description: "Location not found",
                  humidity: 0,
                  wind_speed: 0,
                  icon: "01d",
                  error: `Weather data not available for "${location}". Please check the location name.`
                };
              }

              const data = await response.json();

              if (!response.ok) {
                throw new Error(`Weather API error: ${data.message}`);
              }

              console.log("WEATHER DATA", data)

              return {
                location: data.name,
                temperature: Math.round(data.main.temp),
                feels_like: Math.round(data.main.feels_like),
                condition: data.weather[0].main,
                description: data.weather[0].description,
                humidity: data.main.humidity,
                wind_speed: Math.round(data.wind.speed * 10) / 10,
                icon: data.weather[0].icon,
              };
            } catch (error) {
              console.error("Weather API error:", error);
              return {
                location,
                temperature: 0,
                feels_like: 0,
                condition: "Unknown",
                description: "Weather service temporarily unavailable",
                humidity: 0,
                wind_speed: 0,
                icon: "01d",
                error: error instanceof Error ? error.message : "Failed to fetch weather data"
              };
            }
          }
        }),
        news: tool({
          description: "Search for latest news articles or get top headlines",
          inputSchema: z.object({
            query: z.string().optional().describe("Search query for news articles. If not provided, returns top headlines"),
            country: z.string().optional().describe("Country code for news (e.g., 'us', 'gb', 'in'). Default is 'us'"),
            category: z.string().optional().describe("News category: business, entertainment, general, health, science, sports, technology"),
          }),
          execute: async ({ query, country = "us", category }: { query?: string; country?: string; category?: string }) => {
            try {
              const apiKey = process.env.NEWS_API_KEY;
              if (!apiKey) {
                return {
                  articles: [],
                  totalResults: 0,
                  error: "News API key not configured"
                };
              }

              let url: string;
              if (query) {
                // Search for specific query
                url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${apiKey}`;
              } else {
                // Get top headlines
                url = `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=5&apiKey=${apiKey}`;
                if (category) {
                  url += `&category=${category}`;
                }
              }

              const response = await fetch(url);

              if (!response.ok) {
                if (response.status === 401) {
                  return {
                    articles: [],
                    totalResults: 0,
                    error: "News API authentication failed. Please check your API key."
                  };
                } else if (response.status === 429) {
                  return {
                    articles: [],
                    totalResults: 0,
                    error: "News API rate limit exceeded. Please try again later."
                  };
                }
                throw new Error(`News API error: ${response.status}`);
              }

              const data = await response.json();

              if (data.status === "error") {
                return {
                  articles: [],
                  totalResults: 0,
                  error: data.message || "News API returned an error"
                };
              }

              const articles = (data.articles || []).map((article: any) => ({
                title: article.title || "No title",
                description: article.description || null,
                url: article.url || "",
                source: article.source?.name || "Unknown source",
                publishedAt: article.publishedAt || new Date().toISOString(),
                urlToImage: article.urlToImage || null,
              }));

              return {
                articles,
                totalResults: data.totalResults || articles.length,
              };
            } catch (error) {
              console.error("News API error:", error);
              return {
                articles: [],
                totalResults: 0,
                error: error instanceof Error ? error.message : "Failed to fetch news data"
              };
            }
          }
        })
      },
    })


    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onError(error) {
        console.error("Streaming error:", error)

        // Provide more specific error messages based on error type
        if (error instanceof Error) {
          if (error.message.includes("timeout")) {
            return "Request timed out. Please try again."
          } else if (error.message.includes("rate")) {
            return "Too many requests. Please wait a moment and try again."
          } else if (error.message.includes("token")) {
            return "Token limit exceeded. Please upgrade your plan."
          } else if (error.message.includes("network")) {
            return "Network error. Please check your connection and try again."
          } else {
            return error.message
          }
        }

        return "An error occurred during response generation. Please try again."
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
            allowOverage: true,
          })
        } catch (tokenError) {
          console.error("Error getting token usage:", tokenError);
          // return new Response("Error getting token usage", { status: 500 })
        }

        console.log(`RAG response completed. Documents used: ${documentsFound}`)
      }
    })

  } catch (error) {
    console.error("Chat API error:", error)

    // Determine appropriate error status and message
    let status = 500
    let errorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred. Please try again."
    }

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes("Unauthorized") || error.message.includes("401")) {
        status = 401
        errorResponse = {
          error: "Unauthorized",
          message: "Please sign in to continue"
        }
      } else if (error.message.includes("timeout")) {
        status = 408
        errorResponse = {
          error: "Request timeout",
          message: "Request timed out. Please try again."
        }
      } else if (error.message.includes("rate") || error.message.includes("429")) {
        status = 429
        errorResponse = {
          error: "Rate limit exceeded",
          message: "Too many requests. Please wait a moment and try again."
        }
      } else if (error.message.includes("token") || error.message.includes("limit")) {
        status = 402
        errorResponse = {
          error: "Token limit exceeded",
          message: "You have reached your token limit. Please upgrade your plan."
        }
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        status = 503
        errorResponse = {
          error: "Service unavailable",
          message: "Network error. Please check your connection and try again."
        }
      } else {
        // Use the actual error message for other cases
        errorResponse.message = error.message
      }
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        status,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
} 

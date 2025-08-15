import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai"
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('PINECONE_INDEX_NAME environment variable is required')
}

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "text-embedding-3-small",
  dimensions: 512
})

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
})

interface FileData {
  url: string
  name: string
  fileId: string
}

interface IndexRequest {
  files: FileData[]
  conversationId?: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    console.log("userId", userId)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { files, conversationId } = await request.json() as IndexRequest

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const indexName = process.env.PINECONE_INDEX_NAME!
    const namespace = `user-${userId}`

    if (!indexName || indexName.trim() === '') {
      throw new Error('Pinecone index name is not configured properly')
    }
    const index = pinecone.index(indexName)

    let totalChunks = 0
    const processedFiles = []

    for (const file of files) {
      try {
        // Download PDF from URL
        const response = await fetch(file.url)
        if (!response.ok) {
          throw new Error(`Failed to download ${file.name}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Create a temporary blob for PDFLoader
        const blob = new Blob([buffer], { type: 'application/pdf' })
        const loader = new PDFLoader(blob)

        // Load and parse PDF
        const docs = await loader.load()

        if (!docs || docs.length === 0) {
          throw new Error(`No content extracted from ${file.name}`)
        }

        // Split text into chunks
        const chunks = await textSplitter.splitDocuments(docs)

        if (chunks.length === 0) {
          throw new Error(`No valid chunks created from ${file.name}`)
        }

        // Generate embeddings for all chunks
        const texts = chunks.map(chunk => chunk.pageContent)

        const vectors = await embeddings.embedDocuments(texts)

        // Prepare vectors for Pinecone
        const pineconeVectors = chunks.map((chunk, index) => ({
          id: `${file.fileId}-chunk-${index}`,
          values: vectors[index],
          metadata: {
            text: chunk.pageContent,
            fileName: file.name,
            userId,
            source: file.url,
            conversationId: conversationId || "",
          }
        }))

        // Upsert to Pinecone with user namespace
        try {
          await index.namespace(namespace).upsert(pineconeVectors)
        } catch (pineconeError) {
          console.error(`Pinecone error for ${file.name}:`, pineconeError)
          throw new Error(`Vector indexing failed: ${pineconeError instanceof Error ? pineconeError.message : 'Unknown Pinecone error'}`)
        }

        totalChunks += chunks.length

        // Get the first few chunks of text content for title generation
        const textContent = chunks.slice(0, 3).map(chunk => chunk.pageContent).join(' ')

        processedFiles.push({
          fileId: file.fileId,
          fileName: file.name,
          chunks: chunks.length,
          textContent: textContent.substring(0, 500), // Limit to 500 chars for title generation
          status: 'success'
        })

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
        throw new Error(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    const successCount = processedFiles.filter(f => f.status === 'success').length
    const failedCount = processedFiles.filter(f => f.status === 'error').length

    return NextResponse.json({
      success: true,
      message: `Indexed ${successCount}/${files.length} files successfully`,
      totalChunks,
      namespace,
      files: processedFiles,
      summary: {
        total: files.length,
        successful: successCount,
        failed: failedCount,
      }
    })

  } catch (error) {
    console.error("Indexing error:", error)
    return NextResponse.json(
      {
        error: "Failed to index files",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
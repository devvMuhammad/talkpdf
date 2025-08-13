import React from 'react'
import { Brain, Zap, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileIndexingLoaderProps {
  files?: string[]
  className?: string
}

export function FileIndexingLoader({ files = [], className }: FileIndexingLoaderProps) {
  return (
    <div className={cn("bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Brain className="h-5 w-5 text-purple-400" />
          <div className="absolute -inset-1 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
          <Sparkles className="absolute -top-0.5 -right-0.5 h-2 w-2 text-yellow-400 animate-pulse" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-200">
            Processing & Indexing PDFs...
          </div>
          <div className="text-xs text-gray-400">
            {files.length} file(s) • Creating embeddings with AI
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-1">
          {files.slice(0, 3).map((fileName, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-purple-300">
              <FileText className="h-3 w-3" />
              <span className="truncate">{fileName}</span>
              <div className="flex items-center gap-1">
                <Zap className="h-2 w-2 text-yellow-400 animate-pulse" style={{ animationDelay: `${index * 300}ms` }} />
              </div>
            </div>
          ))}
          {files.length > 3 && (
            <div className="text-xs text-gray-500 ml-5">
              +{files.length - 3} more files being processed...
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-950/30 rounded px-2 py-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          Extracting text from PDF documents
        </div>
        
        <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-950/30 rounded px-2 py-1">
          <div className="relative">
            <div className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0.5 bg-blue-500/20 rounded-full animate-pulse" />
          </div>
          Generating embeddings with OpenAI
        </div>
        
        <div className="flex items-center gap-2 text-xs text-green-300 bg-green-950/30 rounded px-2 py-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          </div>
          Storing in vector database (Pinecone)
        </div>
      </div>
    </div>
  )
}
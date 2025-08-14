import React from 'react'
import { Upload, Brain, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileProgressCardsProps {
  isUploading: boolean
  isIndexing: boolean
  uploadCompleted: boolean
  indexingCompleted: boolean
  files: string[]
  className?: string
  processStarted: boolean
}

export function FileProgressCards({
  isUploading,
  isIndexing,
  uploadCompleted,
  indexingCompleted,
  files,
  className,
  processStarted
}: FileProgressCardsProps) {
  // Show the component once the process has started and until everything is complete
  if (!processStarted) return null

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Card */}
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-all duration-500",
        uploadCompleted
          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
          : isUploading
            ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
            : "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
      )}>
        <div className="flex-shrink-0">
          {uploadCompleted ? (
            <div className="animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          ) : isUploading ? (
            <div className="relative">
              <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <Loader2 className="absolute -inset-1 h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin opacity-60" />
            </div>
          ) : (
            <Upload className="h-6 w-6 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-sm transition-colors",
            uploadCompleted
              ? "text-green-800 dark:text-green-200"
              : isUploading
                ? "text-blue-800 dark:text-blue-200"
                : "text-gray-500"
          )}>
            {uploadCompleted ? "Upload Complete" : "Uploading Files"}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {files.length} PDF file{files.length !== 1 ? 's' : ''} • Secure cloud storage
          </div>
        </div>
      </div>

      {/* Indexing Card - always show after upload starts, with smooth transitions */}
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-all duration-500 transform",
        // Show after upload starts
        isUploading || isIndexing || uploadCompleted
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-2 scale-95 pointer-events-none",
        // State-based styling
        indexingCompleted
          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
          : isIndexing
            ? "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800"
            : "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
      )}>
        <div className="flex-shrink-0">
          {indexingCompleted ? (
            <div className="animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          ) : isIndexing ? (
            <div className="relative">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <Loader2 className="absolute -inset-1 h-8 w-8 text-purple-600 dark:text-purple-400 animate-spin opacity-60" />
            </div>
          ) : (
            <Brain className="h-6 w-6 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-sm transition-colors",
            indexingCompleted
              ? "text-green-800 dark:text-green-200"
              : isIndexing
                ? "text-purple-800 dark:text-purple-200"
                : "text-gray-500"
          )}>
            {indexingCompleted ? "Processing Complete" : isIndexing ? "Processing & Indexing" : "Ready to Process"}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {isIndexing ? "Extracting text • Creating embeddings • Vector storage" :
              indexingCompleted ? "Text extracted • Embeddings created • Ready for chat" :
                "Waiting for upload completion"}
          </div>
        </div>
      </div>
    </div>
  )
}
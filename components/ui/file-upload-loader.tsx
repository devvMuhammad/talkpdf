import React from 'react'
import { Upload, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadLoaderProps {
  files?: string[]
  className?: string
}

export function FileUploadLoader({ files = [], className }: FileUploadLoaderProps) {
  return (
    <div className={cn("bg-gray-900/80 rounded-lg border border-gray-700 p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Upload className="h-5 w-5 text-blue-400" />
          <div className="absolute -inset-1 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-200">
            Uploading files to secure storage...
          </div>
          <div className="text-xs text-gray-400">
            {files.length} file(s) • This may take a moment
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-1">
          {files.slice(0, 3).map((fileName, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
              <FileText className="h-3 w-3" />
              <span className="truncate">{fileName}</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${index * 200}ms` }} />
              </div>
            </div>
          ))}
          {files.length > 3 && (
            <div className="text-xs text-gray-500 ml-5">
              +{files.length - 3} more files...
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-950/30 rounded px-2 py-1">
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
        Files are being securely stored in the cloud
      </div>
    </div>
  )
}
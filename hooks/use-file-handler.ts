import { useState, useCallback } from 'react'
import { toast } from './use-toast'

export interface FileData {
  fileId: string
  url: string
  name: string
  size: number
  type: string
}

export interface IndexingResult {
  fileId: string
  fileName: string
  chunks: number
  textContent?: string
  status: 'success' | 'error'
}

export interface UseFileHandlerReturn {
  // Upload states
  isUploading: boolean
  uploadError: string | null
  
  // Indexing states
  isIndexing: boolean
  indexingError: string | null
  
  // Actions
  uploadFiles: (files: File[]) => Promise<FileData[]>
  indexFiles: (files: FileData[], conversationId?: string) => Promise<IndexingResult[]>
  clearErrors: () => void
  reset: () => void
}

export function useFileHandler(): UseFileHandlerReturn {
  // Upload states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Indexing states
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexingError, setIndexingError] = useState<string | null>(null)

  const uploadFiles = useCallback(async (files: File[]): Promise<FileData[]> => {
    if (files.length === 0) return []

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Check if it's a limit-related error for better handling
        if (response.status === 413 || response.status === 429) {
          // This is a limit error, provide more specific messaging
          throw new Error(errorData.error || 'Upload limit exceeded')
        }
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()

      toast({
        title: "Upload successful",
        description: `${result.files.length} file(s) uploaded successfully`,
      })

      return result.files

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(errorMessage)

      // Provide different toast messaging for limit vs other errors
      const isLimitError = errorMessage.toLowerCase().includes('limit') || 
                          errorMessage.toLowerCase().includes('exceed') ||
                          errorMessage.toLowerCase().includes('upgrade')

      toast({
        title: isLimitError ? "Storage limit exceeded" : "Upload failed",
        description: errorMessage,
        variant: "destructive",
        duration: isLimitError ? 10000 : 5000, // Show limit errors longer
      })

      throw error
    } finally {
      setIsUploading(false)
    }
  }, [])

  const indexFiles = useCallback(async (files: FileData[], conversationId?: string): Promise<IndexingResult[]> => {
    if (files.length === 0) return []

    setIsIndexing(true)
    setIndexingError(null)

    try {
      const response = await fetch('/api/index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files, conversationId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Indexing failed')
      }

      const result = await response.json()

      toast({
        title: "Indexing complete",
        description: `${result.summary.successful}/${result.summary.total} files indexed with ${result.totalChunks} total chunks`,
      })

      return result.files || []

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Indexing failed'
      setIndexingError(errorMessage)

      toast({
        title: "Indexing failed",
        description: errorMessage,
        variant: "destructive"
      })

      throw error
    } finally {
      setIsIndexing(false)
    }
  }, [])

  const clearErrors = useCallback(() => {
    setUploadError(null)
    setIndexingError(null)
  }, [])

  const reset = useCallback(() => {
    setIsUploading(false)
    setUploadError(null)
    setIsIndexing(false)
    setIndexingError(null)
  }, [])

  return {
    // Upload states
    isUploading,
    uploadError,
    
    // Indexing states
    isIndexing,
    indexingError,
    
    // Actions
    uploadFiles,
    indexFiles,
    clearErrors,
    reset,
  }
}
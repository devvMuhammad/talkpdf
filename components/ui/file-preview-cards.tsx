"use client";

import React from "react";
import { FileText, X, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileData } from "@/hooks/use-file-handler";

interface FilePreviewCardsProps {
  files: File[];
  uploadedFiles?: FileData[];
  className?: string;
  onRemoveFile?: (index: number) => void;
  isUploading?: boolean;
  isIndexing?: boolean;
}

export function FilePreviewCards({
  files,
  uploadedFiles = [],
  className = "",
  onRemoveFile,
  isUploading = false,
  isIndexing = false
}: FilePreviewCardsProps) {
  if (!files || files.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-2 mb-3", className)}>
      {files.map((file, index) => {
        const isUploaded = uploadedFiles.some(uf => uf.name === file.name);
        const isProcessing = isUploading || isIndexing;

        return (
          <Card
            key={index}
            className={cn(
              "relative overflow-hidden border transition-all duration-200",
              isUploaded
                ? "bg-green-950/20 border-green-800"
                : isProcessing
                  ? "bg-blue-950/20 border-blue-800"
                  : "bg-gray-800/60 border-gray-700 hover:border-gray-600"
            )}
          >
            <div className="p-3">
              <div className="flex items-center gap-3">
                {/* File icon with status indicator */}
                <div className="flex-shrink-0 relative">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isUploaded
                      ? "bg-green-500/20"
                      : isProcessing
                        ? "bg-blue-500/20"
                        : "bg-red-500/20"
                  )}>
                    <FileText className={cn(
                      "w-5 h-5",
                      isUploaded
                        ? "text-green-400"
                        : isProcessing
                          ? "text-blue-400"
                          : "text-red-400"
                    )} />
                  </div>

                  {/* Status indicator */}
                  {isUploaded && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                      <Upload className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-400">
                      {formatFileSize(file.size)} • PDF
                    </p>
                    {isUploaded && (
                      <span className="text-xs text-green-400 font-medium">
                        Ready
                      </span>
                    )}
                    {isUploading && (
                      <span className="text-xs text-blue-400 font-medium">
                        Uploading...
                      </span>
                    )}
                    {isIndexing && (
                      <span className="text-xs text-purple-400 font-medium">
                        Processing...
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                {onRemoveFile && !isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(index)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}


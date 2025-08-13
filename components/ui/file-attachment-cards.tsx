"use client";

import React from "react";
import { FileText, Download, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FileAttachment {
  type: string;
  mediaType?: string;
  filename?: string;
  url?: string;
}

interface FileAttachmentCardsProps {
  files: FileAttachment[];
  className?: string;
}

export function FileAttachmentCards({ files, className = "" }: FileAttachmentCardsProps) {
  if (!files || files.length === 0) return null;

  const isImage = (mediaType?: string) => mediaType?.startsWith("image/") || false;
  const isPDF = (mediaType?: string) => mediaType === "application/pdf";

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className={`flex flex-wrap gap-3 mb-3 ${className}`}>
      {files.map((file, index) => {
        if (!file.url || !file.filename) return null;

        return (
          <Card
            key={index}
            className="relative overflow-hidden bg-gray-800/60 border border-gray-700 hover:border-gray-600 transition-colors max-w-xs"
          >
            {isImage(file.mediaType) ? (
              // Image file card
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                  <div className="hidden w-full h-full bg-gray-700 flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Image
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.url!, file.filename!)}
                      className="h-8 w-8 p-0 ml-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : isPDF(file.mediaType) ? (
              // PDF file card
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF Document
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file.url!, file.filename!)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700 flex-shrink-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              // Generic file card
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-600/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">
                      {file.mediaType?.split("/")[0]} file
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file.url!, file.filename!)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700 flex-shrink-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
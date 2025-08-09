"use client";

import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ChatForm } from "@/components/chat-form";
import { useChat } from "@ai-sdk/react";
import { UploadCloud, FileText, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";

interface WelcomeStageProps {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setInput: (value: string) => void;
  input: string;
}

function WelcomeStage({
  handleSubmit,
  setInput,
  input,
}: WelcomeStageProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFilesChosen = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter(
      (f) => f.type === "application/pdf"
    );
    if (pdfs.length) {
      setSelectedFiles((prev) => [...prev, ...pdfs]);
      setUploadSuccess(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    onFilesChosen(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const totalSizeLabel = useMemo(() => {
    const total = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const mb = total / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }, [selectedFiles]);

  const uploadFiles = useCallback(async () => {
    if (!selectedFiles.length) return;
    setIsUploading(true);
    setUploadSuccess(null);
    try {
      const form = new FormData();
      selectedFiles.forEach((f) => form.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setUploadSuccess(`Uploaded ${data.uploaded} file(s) successfully`);
    } catch (err) {
      setUploadSuccess("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-100">Welcome to TalkPDF</h1>
          <p className="text-gray-400 text-lg">
            Get started by uploading one or more PDF files, or ask a question
            directly.
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative rounded-2xl border-2 border-dashed ${isDragging
            ? "border-blue-500 bg-blue-500/5"
            : "border-gray-700 bg-gray-900/60"
            } p-8 transition-colors`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => onFilesChosen(e.target.files)}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-gray-800 p-3 border border-gray-700">
              <UploadCloud className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-gray-200">
              Drag and drop your PDFs here, or
              <button
                type="button"
                className="ml-1 text-blue-400 hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </div>
            <div className="text-xs text-gray-400">
              Only PDF files are supported
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-300">
                  Selected files ({selectedFiles.length}) • {totalSizeLabel}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-gray-300"
                  onClick={() => setSelectedFiles([])}
                >
                  Clear
                </Button>
              </div>
              <ul className="space-y-2 max-h-56 overflow-auto pr-2">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-300" />
                      <div>
                        <div className="text-sm text-gray-100 line-clamp-1">
                          {file.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-200"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle2
                    className={`h-4 w-4 ${uploadSuccess ? "text-green-400" : "text-gray-500"
                      }`}
                  />
                  <span>
                    {uploadSuccess
                      ? uploadSuccess
                      : "Files are uploaded securely for analysis."}
                  </span>
                </div>
                <Button
                  onClick={uploadFiles}
                  disabled={isUploading || selectedFiles.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? "Uploading..." : "Upload PDFs"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-transparent" />
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden shadow-2xl"
          >
            <AutoResizeTextarea
              onKeyDown={handleKeyDown}
              onChange={(value) => setInput(value)}
              value={input}
              placeholder="Ask a question about your PDFs or anything else... (Enter to send)"
              className="w-full bg-transparent text-gray-100 placeholder:text-gray-400 focus:outline-none border-none resize-none px-8 py-6 text-base min-h-[120px]"
            />
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/50">
              <div className="text-sm text-gray-400">
                Press{" "}
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">
                  Enter
                </kbd>{" "}
                to send
              </div>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6 py-2 text-sm font-medium transition-colors"
                disabled={!input.trim()}
              >
                Start Chat
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const { messages, sendMessage } = useChat();
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    sendMessage({ text: value });
    setInput("");
  };

  return (
    <>
      <AppHeader isChatActive={messages.length > 0} />
      <div className="flex-1 bg-gray-950 overflow-hidden">
        <WelcomeStage
          handleSubmit={handleSubmit}
          setInput={setInput}
          input={input}
        />
      </div>
    </>
  );
}

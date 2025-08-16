"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { SparklesIcon, PaperclipIcon, SendHorizontal, ChevronDown } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, FileUIPart, type UIMessage } from "ai";

import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";
import { toast } from "sonner";
import { MemoizedMarkdown } from "./memoized-markdown";
import { FileAttachmentCards } from "@/components/ui/file-attachment-cards";
import { FilePreviewCards } from "@/components/ui/file-preview-cards";
import { WeatherWidget } from "@/components/ui/weather-widget";
import { NewsWidget } from "@/components/ui/news-widget";
import { useFileHandler } from "@/hooks/use-file-handler";

interface ChatFormProps extends React.ComponentProps<"form"> {
  conversationId?: string;
  initialMessages: any[] | null;
  files?: Doc<"files">[];
}

export function ChatForm({ conversationId, initialMessages }: ChatFormProps) {
  const { messages, status, sendMessage } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { conversationId },
    }),
    messages: initialMessages as UIMessage[],
    experimental_throttle: 50,
    onData: (data) => {
      console.log("DATA", data)
    },
    onFinish: (message) => {
      console.log("FINISH", message)
    },
    onError: (error) => {
      console.error("Chat error:", error)
      toast.error(error.message || "Something went wrong. Please try again.", {
        duration: 8000,
        className: "bg-red-950 text-red-50 border-red-800",
      });
    }
  });

  const [input, setInput] = useState("");

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { uploadFiles, indexFiles, isUploading, isIndexing } = useFileHandler();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = status === "submitted";

  // Keep a ref to the scrollable container so we can auto-scroll to bottom
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const isAtBottomRef = useRef<boolean>(true);
  isAtBottomRef.current = isAtBottom;

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  // On mount, scroll to the bottom smoothly and initialize input height
  useEffect(() => {
    const id = window.setTimeout(() => {
      scrollToBottom();
      setIsAtBottom(true);
    }, 50);

    return () => {
      window.clearTimeout(id);
    };
  }, []);

  // Track whether user is at the bottom of the list
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 24;
    const onScroll = () => {
      const atBottomNow = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
      setIsAtBottom(atBottomNow);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    // Initialize state
    onScroll();
    return () => {
      el.removeEventListener("scroll", onScroll as EventListener);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = input.trim();

    // If there are files to upload but no text, require at least some text
    if (selectedFiles.length > 0 && !value) {
      toast.error("Please add a message to send with your files", {
        className: "bg-red-950 text-red-50 border-red-800",
      });
      return;
    }

    if (!value && selectedFiles.length === 0) return;

    try {
      let files: FileUIPart[] = [];

      // Handle file uploads if there are any
      if (selectedFiles.length > 0) {
        // Upload files
        const uploaded = await uploadFiles(selectedFiles);

        // Index files  
        await indexFiles(uploaded, conversationId);

        // Add file parts to message
        files = uploaded.map(file => ({
          type: "file",
          mediaType: file.type,
          filename: file.name,
          url: file.url
        }));

        // Clear uploaded files
        setSelectedFiles([]);
        setUploadedFiles([]);
      }

      sendMessage({
        text: value,
        files
      });

      setInput("");
      scrollToBottom();

    } catch (error) {
      console.error("Error sending message with files:", error);

      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.", {
        duration: 8000,
        className: "bg-red-950 text-red-50 border-red-800",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      // Validate file types
      const invalidFiles = fileArray.filter(file => file.type !== "application/pdf");
      if (invalidFiles.length > 0) {
        toast.error("Only PDF files are supported", {
          className: "bg-red-950 text-red-50 border-red-800",
        });
        return;
      }
      setSelectedFiles(prev => [...prev, ...fileArray]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full pt-12 min-h-0 flex flex-col overflow-hidden">
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-0">
        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 pb-20 chat-scroll"
        >
          <div className="flex flex-col gap-4 md:gap-6 mx-auto">
            {messages.map((message, index) => {
              const isAssistant = message.role === "assistant";

              // Separate different types of parts
              const textParts = message.parts.filter(part => part.type === "text");
              const fileParts = message.parts.filter(part => part.type === "file");
              const toolParts = message.parts.filter(part => part.type.startsWith("tool-"));
              const textContent = textParts.map(part => part.text).join("");

              return (
                <div key={index} className={`w-full flex ${isAssistant ? "justify-start" : "justify-end"}`}>
                  <div className={isAssistant ? "w-full" : "max-w-[75%]"}>
                    {/* File attachments above the message bubble */}
                    {fileParts.length > 0 && (
                      <div className="mb-2">
                        <FileAttachmentCards
                          files={fileParts}
                          className={isAssistant ? "" : "justify-end"}
                        />
                      </div>
                    )}

                    {/* Tool call results */}
                    {isAssistant && toolParts.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {toolParts.map((toolPart: any, toolIndex) => {
                          if (toolPart.type === "tool-weather" && toolPart.state === "output-available") {
                            return (
                              <WeatherWidget
                                key={toolIndex}
                                data={toolPart.output}
                              />
                            );
                          }
                          
                          if (toolPart.type === "tool-news" && toolPart.state === "output-available") {
                            return (
                              <NewsWidget
                                key={toolIndex}
                                data={toolPart.output}
                              />
                            );
                          }
                          
                          // Handle loading state for tool calls
                          if (toolPart.state === "loading" || toolPart.state === "executing") {
                            const toolName = toolPart.type.replace("tool-", "");
                            return (
                              <div key={toolIndex} className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75" />
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150" />
                                </div>
                                <span className="text-gray-300 capitalize">Getting {toolName} data...</span>
                              </div>
                            );
                          }
                          
                          return null;
                        })}
                      </div>
                    )}

                    {/* Message bubble */}
                    {textContent.trim() && (
                      <div
                        className={
                          isAssistant
                            ? "w-full whitespace-normal text-[15px] leading-6 text-gray-200 tracking-[-0.01em]"
                            : "rounded-2xl px-4 py-3 text-[15px] leading-6 bg-blue-600 text-white shadow-md"
                        }
                      >
                        {isAssistant ? (
                          <MemoizedMarkdown content={textContent} id={message.id} />
                        ) : (
                          textContent
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="self-start flex items-center gap-2 px-1 py-1 text-gray-400">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150" />
                </div>
                <span className="text-sm text-gray-400">AI is responding...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Input Area */}
      <div ref={inputContainerRef} className="px-6 shrink-0 relative">
        <div className="max-w-4xl mx-auto">
          {/* Scroll to bottom button */}
          {!isAtBottom && (
            <Button
              onClick={scrollToBottom}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 h-10 w-10 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white shadow-lg border border-gray-700 transition-all duration-200 hover:scale-105 z-10"
              size="sm"
            >
              <ChevronDown size={20} />
            </Button>
          )}

          {/* File Preview Cards */}
          {selectedFiles.length > 0 && (
            <div className="mb-3">
              <FilePreviewCards
                files={selectedFiles}
                uploadedFiles={uploadedFiles}
                onRemoveFile={handleRemoveFile}
                isUploading={isUploading}
                isIndexing={isIndexing}
              />
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden shadow-lg"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <AutoResizeTextarea
              onKeyDown={handleKeyDown}
              onChange={(v) => setInput(v)}
              value={input}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="w-full bg-transparent text-gray-100 placeholder:text-gray-400 focus:outline-none border-none resize-none px-6 py-4 text-base min-h-[60px] max-h-[200px]"
            />
            <div className="flex items-center justify-end px-4 py-3 border-t border-gray-700 bg-gray-800/30 rounded-b-2xl">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <SparklesIcon size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isIndexing}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  <PaperclipIcon size={16} />
                </Button>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
                  disabled={(!input.trim() && selectedFiles.length === 0) || isLoading || isUploading || isIndexing}
                >
                  <SendHorizontal size={16} />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

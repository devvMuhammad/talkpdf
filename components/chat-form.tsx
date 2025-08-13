"use client";

import type React from "react";

import { useState, useEffect, useRef, useMemo } from "react";
import { SparklesIcon, PaperclipIcon, SendHorizontal, ChevronDown, Download } from "lucide-react";
import { ModelSelector } from "@/components/model-selector";
import { Doc, Id } from "@/convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { MemoizedMarkdown } from "./memoized-markdown";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { FileAttachmentCards } from "@/components/ui/file-attachment-cards";

interface ChatFormProps extends React.ComponentProps<"form"> {
  conversationId?: string;
  initialMessages: any[] | null;
  files?: Doc<"files">[];
}

export function ChatForm({ conversationId, initialMessages, files }: ChatFormProps) {
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

      console.error("ERROR", error)
      toast.error(error.message || "An error occurred")
    }
  });

  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [generateImages, setGenerateImages] = useState(false);
  const [filesOpen, setFilesOpen] = useState(true);

  const isLoading = status === "submitted";

  // Keep a ref to the scrollable container so we can auto-scroll to bottom
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const [inputHeight, setInputHeight] = useState<number>(0);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const isAtBottomRef = useRef<boolean>(true);
  isAtBottomRef.current = isAtBottom;

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  // Fetch signed download URLs for files
  const fileIds = useMemo(() => (files && files.length > 0 ? files.map((f) => f._id as Id<"files">) : []), [files]);
  const downloadArgs = useMemo(() => (fileIds.length > 0 ? { fileIds } : "skip" as const), [fileIds]);
  const downloadInfo = useQuery(api.files.getDownloadUrls, downloadArgs);

  const fileIdToUrl = useMemo(() => {
    const map = new Map<string, string>();
    if (downloadInfo) {
      for (const d of downloadInfo as any[]) {
        map.set(String(d.fileId), d.url);
      }
    }
    return map;
  }, [downloadInfo]);

  // On mount, scroll to the bottom smoothly and initialize input height
  useEffect(() => {
    const id = window.setTimeout(() => {
      scrollToBottom();
      setIsAtBottom(true);
    }, 50);

    const measure = () => {
      const el = inputContainerRef.current;
      if (!el) return;
      setInputHeight(el.offsetHeight || 0);
    };

    measure();

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    sendMessage({ text: value });
    setInput("");
    scrollToBottom()
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
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

              // Separate text parts and file parts
              const textParts = message.parts.filter(part => part.type === "text");
              const fileParts = message.parts.filter(part => part.type === "file");
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

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden shadow-lg"
          >
            {/* Scroll-to-bottom above the textarea */}
            <AutoResizeTextarea
              onKeyDown={handleKeyDown}
              onChange={(v) => setInput(v)}
              value={input}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="w-full bg-transparent text-gray-100 placeholder:text-gray-400 focus:outline-none border-none resize-none px-6 py-4 text-base min-h-[60px] max-h-[200px]"
            />
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-800/30 rounded-b-2xl">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                generateImages={generateImages}
                onGenerateImagesChange={setGenerateImages}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <SparklesIcon size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <PaperclipIcon size={16} />
                </Button>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
                  disabled={!input.trim() || isLoading}
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

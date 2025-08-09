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

interface ChatFormProps extends React.ComponentProps<"form"> {
  conversationId?: string;
  initialMessages?: UIMessage[];
  files?: Doc<"files">[];
}

export function ChatForm({ conversationId, initialMessages, files }: ChatFormProps) {
  const { messages, status, sendMessage } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { conversationId },

    }),
    messages: initialMessages,
    experimental_throttle: 100,
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

  // // Track whether user is at the bottom of the list
  // useEffect(() => {
  //   const el = messagesContainerRef.current;
  //   if (!el) return;
  //   const threshold = 24;
  //   const onScroll = () => {
  //     const atBottomNow = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  //     setIsAtBottom(atBottomNow);
  //   };
  //   el.addEventListener("scroll", onScroll, { passive: true });
  //   // Initialize state
  //   onScroll();
  //   return () => {
  //     el.removeEventListener("scroll", onScroll as EventListener);
  //   };
  // }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    sendMessage({ text: value });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      {files && files.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <Collapsible open={filesOpen} onOpenChange={setFilesOpen}>
            <div className="rounded-xl border border-gray-800 bg-gray-900/60">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-xs text-gray-400">Uploaded files</div>
                <CollapsibleTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-gray-300 hover:text-gray-100 hover:bg-gray-800"
                  >
                    <ChevronDown className={cn("mr-1 h-4 w-4 transition-transform", filesOpen ? "rotate-180" : "rotate-0")} />
                    {filesOpen ? "Hide" : "Show"}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {files.map((f: any) => (
                      <div key={f._id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-blue-600/20 border border-blue-700/30 flex items-center justify-center text-blue-300 text-xs">PDF</div>
                          <div className="min-w-0">
                            <div className="text-sm text-gray-100 truncate">{f.name}</div>
                            <div className="text-xs text-gray-500">{(f.size / (1024 * 1024)).toFixed(2)} MB</div>
                          </div>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-gray-300 hover:text-gray-100 hover:bg-gray-800"
                          disabled={!fileIdToUrl.get(String(f._id))}
                          title={fileIdToUrl.get(String(f._id)) ? "Download" : "Preparing link..."}
                        >
                          <a href={fileIdToUrl.get(String(f._id)) || undefined} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      )}
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-0">
        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 pt-6 chat-scroll"
        >
          <div className="flex flex-col gap-4 md:gap-6 mx-auto">
            {messages.map((message, index) => {
              const text = message.parts
                .map((part) => (part.type === "text" ? part.text : ""))
                .join("");
              const isAssistant = message.role === "assistant";
              return (
                <div
                  key={index}
                  className={
                    isAssistant
                      ? "w-full whitespace-pre-wrap text-[15px] leading-6 text-gray-200 tracking-[-0.01em]"
                      : "max-w-[75%] self-end rounded-2xl px-4 py-3 text-[15px] leading-6 bg-blue-600 text-white shadow-md"
                  }
                >
                  {isAssistant ? (
                    <MemoizedMarkdown content={text} id={message.id} />
                  ) : (
                    text
                  )}
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
      <div ref={inputContainerRef} className="px-6 pt-3 md:pt-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          {!isAtBottom && (
            <div className="flex justify-center px-4 pt-3">
              <Button
                onClick={scrollToBottom}
                className="bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-700"
                size="sm"
                type="button"
              >
                <ChevronDown className="mr-1 h-4 w-4" />
                Scroll to bottom
              </Button>
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="mt-3 sm:mt-4 rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden shadow-lg"
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

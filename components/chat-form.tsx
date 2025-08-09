"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { SparklesIcon, PaperclipIcon, SendHorizontal, ChevronDown } from "lucide-react";
import { ModelSelector } from "@/components/model-selector";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";

interface ChatFormProps extends React.ComponentProps<"form"> {
  conversationId?: string;
  initialMessages?: UIMessage[];
}

export function ChatForm({ conversationId, initialMessages }: ChatFormProps) {
  const { messages, status, sendMessage } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    messages: initialMessages,
    onData: (data) => {
      console.log("DATA", data)
    },
    onFinish: (message) => {
      console.log("FINISH", message)
    }
  });

  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [generateImages, setGenerateImages] = useState(false);

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

    // Observe input container size changes (textarea auto-resize, etc.)
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && inputContainerRef.current) {
      ro = new ResizeObserver(() => measure());
      ro.observe(inputContainerRef.current);
    }

    // Also update on window resize
    window.addEventListener("resize", measure);

    return () => {
      window.clearTimeout(id);
      if (ro && inputContainerRef.current) ro.unobserve(inputContainerRef.current);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Auto-scroll on new messages only if already at bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, status]);

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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="relative flex h-full max-h-full flex-col">
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-4xl mx-auto flex flex-col h-full">
          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-6 pt-6"
            style={{ paddingBottom: Math.max(inputHeight + 24, 96) }}
          >
            <div className="flex flex-col gap-6 md:gap-8 mx-auto">
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
                        ? "w-full whitespace-pre-wrap text-[15px] leading-7 text-gray-200 tracking-[-0.01em]"
                        : "max-w-[75%] self-end rounded-2xl px-4 py-3 text-[15px] leading-6 bg-blue-600 text-white shadow-md"
                    }
                  >
                    {text}
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
          {/* Floating Scroll-to-bottom Button */}
          {!isAtBottom && (
            <div
              className="fixed right-6 z-30"
              style={{ bottom: Math.max(inputHeight + 16, 96) }}
            >
              <Button
                onClick={scrollToBottom}
                className="shadow-lg bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-700"
                size="sm"
              >
                <ChevronDown className="mr-1 h-4 w-4" />
                Scroll to bottom
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Input Area */}
      <div ref={inputContainerRef} className="absolute bottom-40 px-6 left-0 right-0 z-20 pt-3 md:pt-4">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="mt-3 sm:mt-4 rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden shadow-lg"
          >
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

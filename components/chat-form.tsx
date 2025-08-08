"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { SparklesIcon, PaperclipIcon, SendHorizontal } from "lucide-react";
import { ModelSelector } from "@/components/model-selector";

import { useChat } from "ai/react";

import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";
import { WelcomeStage } from "./welcome-stage";

interface ChatFormProps extends React.ComponentProps<"form"> {
  conversationId?: string;
  onChatStart?: () => void;
}

export function ChatForm({ conversationId, onChatStart }: ChatFormProps) {
  const { messages, input, setInput, append, isLoading } = useChat({
    api: "/api/chat",
    id: conversationId,
  });

  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [generateImages, setGenerateImages] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);

  useEffect(() => {
    if (messages.length > 0 && !isChatActive) {
      setIsChatActive(true);
      onChatStart?.();
    }
  }, [messages, isChatActive, onChatStart]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    append({ content: input, role: "user" });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const ActiveChatStage = (
    <div className="flex h-full max-h-full flex-col">
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-4xl mx-auto flex flex-col h-full">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  data-role={message.role}
                  className="max-w-[85%] rounded-2xl px-4 py-3 text-sm data-[role=assistant]:self-start data-[role=user]:self-end data-[role=assistant]:bg-gray-800 data-[role=user]:bg-blue-600 data-[role=assistant]:text-gray-100 data-[role=user]:text-white border data-[role=assistant]:border-gray-700 data-[role=user]:border-blue-500 shadow-sm"
                >
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className="self-start flex items-center gap-2 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150" />
                  </div>
                  <span className="text-sm text-gray-400">AI is typing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="px-6 pb-6">
            <div className="max-w-3xl mx-auto">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden shadow-lg"
              >
                <AutoResizeTextarea
                  onKeyDown={handleKeyDown}
                  onChange={(v) => setInput(v)}
                  value={input}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  className="w-full bg-transparent text-gray-100 placeholder:text-gray-400 focus:outline-none border-none resize-none px-6 py-4 text-base min-h-[60px] max-h-[200px]"
                />
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-800/30">
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
      </div>
    </div>
  );

  return (
    <div className="h-full transition-all duration-500 ease-in-out">
      {!isChatActive ? (
        <WelcomeStage
          handleSubmit={handleSubmit}
          setInput={setInput}
          input={input}
        />
      ) : (
        ActiveChatStage
      )}
    </div>
  );
}

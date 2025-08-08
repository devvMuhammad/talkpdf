"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";

interface WelcomeStageProps {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setInput: (value: string) => void;
  input: string;
}

export function WelcomeStage({
  handleSubmit,
  setInput,
  input,
}: WelcomeStageProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-2xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">
            Welcome to AI Assistant
          </h1>
          <p className="text-gray-400 text-lg">
            Start a conversation by typing your message below. I'm here to help
            with any questions or tasks you have.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl mx-auto rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden shadow-2xl"
        >
          <AutoResizeTextarea
            onKeyDown={handleKeyDown}
            onChange={(value) => setInput(value)}
            value={input}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            className="w-full bg-transparent text-gray-100 placeholder:text-gray-400 focus:outline-none border-none resize-none px-8 py-6 text-base min-h-[160px]"
          />
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/50">
            <div className="text-sm text-gray-400">
              Press{" "}
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Enter</kbd>{" "}
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
  );
}

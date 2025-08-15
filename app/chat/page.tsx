import WelcomeStage from "@/components/welcome-stage";
import type { Metadata } from "next";
import type React from "react";
import { Suspense } from "react";


export const metadata: Metadata = {
  title: "Start a new chat | TalkPDF",
  description: "Upload PDF files and start a new conversation with AI to analyze your documents.",
}

export default function Page() {
  return (
    <div className="flex-1 bg-gray-950 overflow-hidden">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <WelcomeStage />
      </Suspense>
    </div>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function TinyLoader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)} aria-live="polite">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse delay-75" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse delay-150" />
      </div>
      {label && <span className="text-xs text-gray-400">{label}</span>}
    </div>
  );
}



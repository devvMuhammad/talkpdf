"use client"

import { cn } from "@/lib/utils"
import { useRef, useEffect, type TextareaHTMLAttributes } from "react"

interface AutoResizeTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value: string
  onChange: (value: string) => void
}

export function AutoResizeTextarea({ className, value, onChange, ...props }: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resizeTextarea = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const newHeight = Math.max(textarea.scrollHeight, Number.parseInt(props.style?.minHeight as string) || 60)
      const maxHeight = Number.parseInt(props.style?.maxHeight as string) || 200
      textarea.style.height = `${Math.min(newHeight, maxHeight)}px`
    }
  }

  useEffect(() => {
    resizeTextarea()
  }, [value])

  return (
    <textarea
      {...props}
      value={value}
      ref={textareaRef}
      onChange={(e) => {
        onChange(e.target.value)
        resizeTextarea()
      }}
      className={cn("resize-none overflow-hidden", className)}
      style={{
        minHeight: "60px",
        maxHeight: "200px",
        ...props.style,
      }}
    />
  )
}

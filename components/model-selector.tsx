"use client"

import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

const models = [
  { id: "gpt-4o", name: "gpt-4o", provider: "OpenAI", tier: 3 },
  { id: "gpt-4o-mini", name: "gpt-4o-mini", provider: "OpenAI", tier: 2 },
  { id: "gpt-3.5-turbo", name: "gpt-3.5-turbo", provider: "OpenAI", tier: 1 },
  { id: "claude-3-5-sonnet", name: "claude-3.5-sonnet", provider: "Anthropic", tier: 3 },
  { id: "claude-3-haiku", name: "claude-3-haiku", provider: "Anthropic", tier: 1 },
  { id: "gemini-2.0-flash", name: "gemini-2.0-flash", provider: "Google", tier: 3 },
  { id: "gemini-1.5-pro", name: "gemini-1.5-pro", provider: "Google", tier: 2 },
  { id: "llama-3.1-70b", name: "llama-3.1-70b", provider: "Meta", tier: 2 },
]

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  generateImages: boolean
  onGenerateImagesChange: (enabled: boolean) => void
}

function SignalBars({ tier }: { tier: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((bar) => (
        <div key={bar} className={`w-1 rounded-sm ${bar <= tier ? "bg-green-500 h-3" : "bg-gray-600 h-2"}`} />
      ))}
    </div>
  )
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  generateImages,
  onGenerateImagesChange,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const currentModel = models.find((m) => m.id === selectedModel) || models[0]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 px-2 text-sm font-normal text-gray-300 hover:text-gray-100 hover:bg-gray-800 border border-gray-700 rounded-lg"
        >
          <SignalBars tier={currentModel.tier} />
          <span className="ml-2">{currentModel.name}</span>
          <ChevronDownIcon className="ml-2 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-gray-900 border-gray-700 text-gray-100">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => {
              onModelChange(model.id)
              setOpen(false)
            }}
            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 focus:bg-gray-800"
          >
            <SignalBars tier={model.tier} />
            <div className="flex flex-col">
              <span className="text-sm text-gray-100">{model.name}</span>
              <span className="text-xs text-gray-400">{model.provider}</span>
            </div>
            {model.id === selectedModel && <div className="ml-auto w-2 h-2 bg-green-500 rounded-full" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-gray-700" />
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-gray-100">Generate Images</span>
          <Switch
            checked={generateImages}
            onCheckedChange={onGenerateImagesChange}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

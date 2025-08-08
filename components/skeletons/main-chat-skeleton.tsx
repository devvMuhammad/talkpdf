"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function MainChatSkeleton() {
    return (
        <div className="flex h-full max-h-full flex-col">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-gray-800 px-4 bg-gray-900">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 bg-gray-800" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-48 bg-gray-800" />
                        <Skeleton className="h-2 w-2 rounded-full bg-green-900" />
                    </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full bg-gray-800" />
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                    {/* Mimic alternating chat bubbles */}
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={i % 2 === 0 ? "self-start" : "self-end"}>
                            <Skeleton
                                className={
                                    "h-16 w-[60%] rounded-2xl bg-gray-800 " +
                                    (i % 2 === 0
                                        ? "data-[role=assistant]:bg-gray-800"
                                        : "bg-blue-900")
                                }
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Input area */}
            <div className="px-6 pb-6">
                <div className="max-w-3xl mx-auto w-full rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden shadow-lg">
                    <Skeleton className="h-24 bg-gray-800" />
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-800/30">
                        <div className="flex-1">
                            <Skeleton className="h-6 w-64 bg-gray-700" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-lg bg-gray-700" />
                            <Skeleton className="h-8 w-8 rounded-lg bg-gray-700" />
                            <Skeleton className="h-8 w-8 rounded-lg bg-gray-200" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}



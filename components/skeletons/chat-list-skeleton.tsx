"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function ChatListSkeleton() {
    return (
        <div className="p-2 space-y-2">
            <div className="px-3 py-2">
                <Skeleton className="h-3 w-32 bg-gray-800" />
            </div>
            <div className="space-y-2 px-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-transparent hover:border-gray-800">
                        <div className="flex items-start gap-3">
                            <Skeleton className="w-2 h-2 rounded-full mt-2 bg-gray-700" />
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-40 bg-gray-800" />
                                    <Skeleton className="h-3 w-10 bg-gray-800" />
                                </div>
                                <Skeleton className="h-3 w-full bg-gray-800" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 px-4">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24 bg-gray-800" />
                    <Skeleton className="h-2.5 w-full bg-gray-800" />
                </div>
            </div>
        </div>
    )
}



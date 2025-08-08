import { ChatListSkeleton } from "@/components/skeletons/chat-list-skeleton"
import { MainChatSkeleton } from "@/components/skeletons/main-chat-skeleton"

export default function Loading() {
    return (
        <div className="flex h-svh w-full">
            {/* Sidebar area skeleton (width matches sidebar) */}
            <div className="hidden md:flex w-[20rem] flex-col border-r border-gray-800 bg-gray-950">
                <ChatListSkeleton />
            </div>
            {/* Main content skeleton */}
            <div className="flex-1 flex flex-col">
                <MainChatSkeleton />
            </div>
        </div>
    )
}



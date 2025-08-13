export type ConversationSummary = {
    id: string
    title: string
    timestamp: string
    lastMessage: string
}

export type ChatDetail = {
    id: string
    title: string
    messages: Array<{
        id: string
        role: "user" | "assistant" | "system"
        parts: Array<{
            type: string
            text?: string
            mediaType?: string
            filename?: string
            url?: string
        }>
        createdAt: string
    }>
}



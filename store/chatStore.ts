import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  unreadCount: number;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  setOpen: (open: boolean) => void;
  setTyping: (typing: boolean) => void;
  clearChat: () => void;
  markRead: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isOpen: false,
  isTyping: false,
  unreadCount: 0,

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: crypto.randomUUID(), timestamp: new Date() },
      ],
      unreadCount:
        !state.isOpen && msg.role === "assistant"
          ? state.unreadCount + 1
          : state.unreadCount,
    })),

  setOpen: (open) => set({ isOpen: open, unreadCount: open ? 0 : 0 }),

  setTyping: (isTyping) => set({ isTyping }),
  clearChat: () => set({ messages: [], unreadCount: 0 }),
  markRead: () => set({ unreadCount: 0 }),
}));

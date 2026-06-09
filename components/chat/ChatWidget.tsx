"use client"

import {
  useEffect, useRef, useState, useCallback,
} from "react";
import {
  MessageCircle, X, Send, Trash2,
  Sparkles, Minimize2,
} from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import ChatBubble      from "./ChatBubble";
import TypingIndicator from "./TypingIndicator";
import QuickReplies    from "./QuickReplies";

const WELCOME_MESSAGE = {
    role: "assistant" as const,
    content: "Hi! 👋 I'm your AI shopping assistant. I can help you find the perfect outfit, check sizes, or answer any questions. What are you looking for today?"
};

export default function ChatWidget(){
    const {
    messages, isOpen, isTyping, unreadCount,
    addMessage, setOpen, setTyping, clearChat,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
}
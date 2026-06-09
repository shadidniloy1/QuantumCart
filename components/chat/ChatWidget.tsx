"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  Sparkles,
  Minimize2,
} from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import ChatBubble from "./ChatBubble";
import TypingIndicator from "./TypingIndicator";
import QuickReplies from "./QuickReplies";

const WELCOME_MESSAGE = {
  role: "assistant" as const,
  content:
    "Hi! 👋 I'm your AI shopping assistant. I can help you find the perfect outfit, check sizes, or answer any questions. What are you looking for today?",
};

export default function ChatWidget() {
  const {
    messages,
    isOpen,
    isTyping,
    unreadCount,
    addMessage,
    setOpen,
    setTyping,
    clearChat,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  //   Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  //   Focus input when opened
  useEffect(() => {
    if (isOpen && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, minimized]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage(WELCOME_MESSAGE);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setInput("");
      addMessage({ role: "user", content: trimmed });
      setLoading(true);
      setTyping(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: messages.slice(-10),
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.detail ?? "Chat failed");

        addMessage({
          role: "assistant",
          content: data.reply,
        });
      } catch (error: any) {
        addMessage({
          role: "assistant",
          content: "Sorry, I ran into an issue. Please try again! 🙏",
        });
      } finally {
        setLoading(false);
        setTyping(false);
      }
    },
    [messages, loading, addMessage, setTyping],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => {
            setOpen(true);
            setMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-violet-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-violet-700 transition-all hover:scale-110 active:scale-95"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-200 ${
            minimized ? "h-14" : "h-[520px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 flex-shrink-0 rounded-t-2xl bg-white">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                AI Shopping Assistant
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <p className="text-xs text-gray-400">Always online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                title={minimized ? "Expand" : "Minimize"}
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={clearChat}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body — only visible when not minimized */}
          {!minimized && (
            <>
              {/* Message arena */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                  />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies - only show if few messages */}
              {messages.length <= 2 && (
                <QuickReplies onSelect={sendMessage}/>
              )}

              {/* Input area */}
              <div className="flex-shrink-0 border-t border-gray-100 p-3">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    disabled={loading}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition disabled:opacity-50 placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 bg-violet-600 text-white rounded-xl flex items-center justify-center hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Powered by Gemini AI
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

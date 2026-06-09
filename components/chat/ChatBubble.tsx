interface Props {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatBubble({ role, content, timestamp }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${
          isUser ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"
        }`}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}
      >
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-violet-600 text-white rounded-tr-sm"
              : "bg-gray-100 text-gray-800 rounded-tl-sm"
          }`}
        >
          {/* Render newlines properly */}
          {content.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-400 px-1">
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

interface Props {
  onSelect: (text: string) => void;
}

const QUICK_REPLIES = [
  "What's on sale?",
  "Show me t-shirts",
  "What sizes do you have?",
  "What's your return policy?",
  "Do you offer free shipping?",
  "Show featured products",
];

export default function QuickReplies({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {QUICK_REPLIES.map((reply) => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          className="text-xs border border-violet-200 text-violet-600 px-3 py-1.5 rounded-full hover:bg-violet-50 transition-colors whitespace-nowrap font-medium"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
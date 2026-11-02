import type { ReactNode } from "react";
type Props = { from: string; children: ReactNode };

export default function ChatBubble({ from, children }: Props) {
  const isUser = from === "user";
  return (
    <div className={`max-w-[85%] animate-pop rounded-2xl px-4 py-3 text-[15px] ${
      isUser ? "self-start bg-[#F1F4F9]" : "self-end bg-accent text-white"}`}>
      {children}
    </div>
  );
}

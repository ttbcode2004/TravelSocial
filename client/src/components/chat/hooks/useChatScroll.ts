import { useEffect, useRef } from "react";

export default function useChatScroll(
  deps: unknown[]
) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [deps.length]);

  return bottomRef;
}
import {
  useTypingUsers,
} from "../../stores/conversation.store";

interface Props {
  conversationId: string;
}

export default function MessageTyping({
  conversationId,
}: Props) {
  const typing = useTypingUsers(conversationId);

  if (typing.length === 0) return null;

  return (
    <p className="text-xs text-primary animate-pulse">
      {typing.map((u) => u.username).join(", ")}
      {" "}đang nhập...
    </p>
  );
}
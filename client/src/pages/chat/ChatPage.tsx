import { useEffect } from "react";
import { useParams } from "react-router-dom";

import {
  useConversationStore,
} from "../../stores/conversation.store";

import { usePresenceStore } from "../../stores/presence.store";

import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatHeader from "../../components/chat/ChatHeader";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import EmptyChat from "../../components/chat/EmptyChat";

export default function ChatPage() {
  const { conversationId } = useParams();

  const conversations = useConversationStore((s) => s.conversations);
  const fetchConversations = useConversationStore((s) => s.fetchConversations);
  const openConversation = useConversationStore((s) => s.openConversation);

  const initConversationSocket = useConversationStore(
    (s) => s.initSocketListeners
  );

  const initPresenceSocket = usePresenceStore(
    (s) => s.initSocketListeners
  );

  // load conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // socket listeners
  useEffect(() => {
    const offConversation = initConversationSocket();
    const offPresence = initPresenceSocket();

    return () => {
      offConversation();
      offPresence();
    };
  }, []);

  // open active conversation
  useEffect(() => {
    if (!conversationId) return;

    openConversation(conversationId);
  }, [conversationId]);

  const activeConversation = conversations.find(
    (c) => c.id === conversationId
  );

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <ChatSidebar />

      {activeConversation ? (
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader conversation={activeConversation} />

          <MessageList conversationId={activeConversation.id} />

          <MessageInput conversationId={activeConversation.id} />
        </div>
      ) : (
        <EmptyChat />
      )}
    </div>
  );
}
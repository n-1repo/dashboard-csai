"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { Contact, Conversation, ConversationWithContact, Message } from "@/types/database";
import { seedContacts, seedConversations, seedMessages } from "@/lib/seed";

export interface OperatorSession {
  id: string;
  email: string;
  displayName: string;
}

interface StoreState {
  contacts: Contact[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
}

const STATE_KEY = "wa-proto-state-v1";
const SESSION_KEY = "wa-proto-session-v1";

const AUTO_REPLIES = [
  "Baik, ditunggu ya kak 🙏",
  "Oke siap, saya cek dulu ya",
  "Terima kasih infonya!",
  "Untuk saat ini masih tersedia kak",
  "Boleh minta alamat pengirimannya?",
];

function seedState(): StoreState {
  return { contacts: seedContacts, conversations: seedConversations, messages: seedMessages };
}

interface StoreValue {
  ready: boolean;
  operator: OperatorSession | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  contacts: Contact[];
  conversations: ConversationWithContact[];
  getMessages: (conversationId: string | null) => Message[];
  sendMessage: (conversationId: string, text: string) => void;
  updateContact: (id: string, patch: Partial<Contact>) => Contact | null;
  updateConversationStatus: (id: string, status: Conversation["status"]) => void;
  markConversationRead: (id: string) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [operator, setOperator] = useState<OperatorSession | null>(null);
  const [state, setState] = useState<StoreState>(seedState);

  useEffect(() => {
    try {
      const rawState = localStorage.getItem(STATE_KEY);
      if (rawState) setState(JSON.parse(rawState));
      const rawSession = localStorage.getItem(SESSION_KEY);
      if (rawSession) setOperator(JSON.parse(rawSession));
    } catch {
      // corrupted local storage, fall back to seed data
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    if (operator) localStorage.setItem(SESSION_KEY, JSON.stringify(operator));
    else localStorage.removeItem(SESSION_KEY);
  }, [operator, ready]);

  const login = useCallback((email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      return { ok: false, error: "Email dan password wajib diisi" };
    }
    setOperator({ id: "demo-operator", email, displayName: email.split("@")[0] || "Operator" });
    return { ok: true };
  }, []);

  const logout = useCallback(() => setOperator(null), []);

  const conversations = useMemo<ConversationWithContact[]>(() => {
    const contactsById = new Map(state.contacts.map((c) => [c.id, c]));
    return state.conversations
      .map((conv): ConversationWithContact | null => {
        const contact = contactsById.get(conv.contact_id);
        if (!contact) return null;
        const msgs = state.messages[conv.id] ?? [];
        const lastMessage: Message | null = msgs[msgs.length - 1] ?? null;
        return { ...conv, contact, last_message: lastMessage };
      })
      .filter((c): c is ConversationWithContact => c !== null)
      .sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });
  }, [state]);

  const getMessages = useCallback(
    (conversationId: string | null) => (conversationId ? state.messages[conversationId] ?? [] : []),
    [state.messages],
  );

  const sendMessage = useCallback((conversationId: string, text: string) => {
    const now = new Date().toISOString();
    const messageId = crypto.randomUUID();
    const message: Message = {
      id: messageId,
      conversation_id: conversationId,
      meta_message_id: null,
      direction: "OUTBOUND",
      message_type: "TEXT",
      body: text,
      media_url: null,
      media_mime_type: null,
      caption: null,
      status: "SENT",
      sender_phone: null,
      recipient_phone: null,
      timestamp: now,
      raw_payload: null,
      created_at: now,
    };

    setState((prev) => ({
      ...prev,
      messages: { ...prev.messages, [conversationId]: [...(prev.messages[conversationId] ?? []), message] },
      conversations: prev.conversations.map((c) =>
        c.id === conversationId ? { ...c, last_message_id: messageId, last_message_at: now, updated_at: now } : c,
      ),
    }));

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [conversationId]: (prev.messages[conversationId] ?? []).map((m) =>
            m.id === messageId ? { ...m, status: "DELIVERED" } : m,
          ),
        },
      }));
    }, 1200);

    setTimeout(() => {
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const replyAt = new Date().toISOString();
      const replyMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        meta_message_id: null,
        direction: "INBOUND",
        message_type: "TEXT",
        body: reply,
        media_url: null,
        media_mime_type: null,
        caption: null,
        status: "RECEIVED",
        sender_phone: null,
        recipient_phone: null,
        timestamp: replyAt,
        raw_payload: null,
        created_at: replyAt,
      };

      setState((prev) => ({
        ...prev,
        messages: { ...prev.messages, [conversationId]: [...(prev.messages[conversationId] ?? []), replyMessage] },
        conversations: prev.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                last_message_id: replyMessage.id,
                last_message_at: replyAt,
                updated_at: replyAt,
                unread_count: c.unread_count + 1,
              }
            : c,
        ),
      }));
    }, 2400);
  }, []);

  const updateContact = useCallback(
    (id: string, patch: Partial<Contact>): Contact | null => {
      const existing = state.contacts.find((c) => c.id === id);
      if (!existing) return null;
      const updated: Contact = { ...existing, ...patch, updated_at: new Date().toISOString() };
      setState((prev) => ({ ...prev, contacts: prev.contacts.map((c) => (c.id === id ? updated : c)) }));
      return updated;
    },
    [state.contacts],
  );

  const updateConversationStatus = useCallback((id: string, status: Conversation["status"]) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === id ? { ...c, status, updated_at: new Date().toISOString() } : c,
      ),
    }));
  }, []);

  const markConversationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) => (c.id === id && c.unread_count > 0 ? { ...c, unread_count: 0 } : c)),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    setState(seedState());
  }, []);

  const value: StoreValue = {
    ready,
    operator,
    login,
    logout,
    contacts: state.contacts,
    conversations,
    getMessages,
    sendMessage,
    updateContact,
    updateConversationStatus,
    markConversationRead,
    resetDemoData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

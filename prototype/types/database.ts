export type MessageDirection = "INBOUND" | "OUTBOUND";

export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT"
  | "STICKER"
  | "LOCATION"
  | "CONTACT"
  | "INTERACTIVE"
  | "TEMPLATE"
  | "SYSTEM";

export type MessageStatus = "RECEIVED" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export type ConversationStatus = "OPEN" | "PENDING" | "RESOLVED" | "ARCHIVED";

export type Contact = {
  id: string;
  phone_number: string;
  display_name: string | null;
  profile_name: string | null;
  avatar_url: string | null;
  email: string | null;
  notes: string | null;
  tags: string[];
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  contact_id: string;
  wa_account_id: string;
  status: ConversationStatus;
  last_message_id: string | null;
  last_message_at: string | null;
  last_customer_message_at: string | null;
  customer_window_expires_at: string | null;
  unread_count: number;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type ConversationWithContact = Conversation & {
  contact: Contact;
  last_message: Message | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  meta_message_id: string | null;
  direction: MessageDirection;
  message_type: MessageType;
  body: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  caption: string | null;
  status: MessageStatus;
  sender_phone: string | null;
  recipient_phone: string | null;
  timestamp: string;
  raw_payload: unknown;
  created_at: string;
};

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

export type MessageEventType =
  | "WEBHOOK_RECEIVED"
  | "MESSAGE_CREATED"
  | "MESSAGE_SENT"
  | "MESSAGE_DELIVERED"
  | "MESSAGE_READ"
  | "MESSAGE_FAILED"
  | "CONTACT_CREATED"
  | "CONTACT_UPDATED"
  | "CUSTOMER_WINDOW_STARTED"
  | "CUSTOMER_WINDOW_RESET";

export type Operator = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: string;
  updated_at: string;
};

export type WaAccount = {
  id: string;
  name: string;
  phone_number: string;
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
  status: string;
  created_at: string;
  updated_at: string;
};

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

export type MessageEvent = {
  id: string;
  message_id: string | null;
  contact_id: string | null;
  event_type: MessageEventType;
  payload: unknown;
  created_at: string;
};

export type ContactImport = {
  id: string;
  filename: string;
  total_rows: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  invalid_count: number;
  imported_by: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      operators: {
        Row: Operator;
        Insert: Partial<Operator> & Pick<Operator, "email" | "password_hash" | "display_name">;
        Update: Partial<Operator>;
        Relationships: [];
      };
      wa_accounts: {
        Row: WaAccount;
        Insert: Partial<WaAccount> &
          Pick<WaAccount, "name" | "phone_number" | "phone_number_id" | "business_account_id" | "access_token">;
        Update: Partial<WaAccount>;
        Relationships: [];
      };
      contacts: {
        Row: Contact;
        Insert: Partial<Contact> & Pick<Contact, "phone_number">;
        Update: Partial<Contact>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: Partial<Omit<Conversation, "customer_window_expires_at">> &
          Pick<Conversation, "contact_id" | "wa_account_id">;
        Update: Partial<Omit<Conversation, "customer_window_expires_at">>;
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_last_message_id_fkey";
            columns: ["last_message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: Message;
        Insert: Partial<Message> & Pick<Message, "conversation_id" | "direction" | "message_type" | "status">;
        Update: Partial<Message>;
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      message_events: {
        Row: MessageEvent;
        Insert: Partial<MessageEvent> & Pick<MessageEvent, "event_type">;
        Update: Partial<MessageEvent>;
        Relationships: [];
      };
      contact_imports: {
        Row: ContactImport;
        Insert: Partial<ContactImport> & Pick<ContactImport, "filename" | "total_rows" | "imported_by">;
        Update: Partial<ContactImport>;
        Relationships: [
          {
            foreignKeyName: "contact_imports_imported_by_fkey";
            columns: ["imported_by"];
            isOneToOne: false;
            referencedRelation: "operators";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_conversation_unread: {
        Args: {
          p_conversation_id: string;
          p_message_id: string;
          p_timestamp: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      message_direction: MessageDirection;
      message_type: MessageType;
      message_status: MessageStatus;
      conversation_status: ConversationStatus;
      message_event_type: MessageEventType;
    };
  };
};

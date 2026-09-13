export interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string;
  changes: MetaWebhookChange[];
}

export interface MetaWebhookChange {
  field: string;
  value: MetaWebhookValue;
}

export interface MetaWebhookValue {
  messaging_product: "whatsapp";
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: MetaContact[];
  messages?: MetaMessage[];
  statuses?: MetaStatus[];
}

export interface MetaContact {
  profile: { name: string };
  wa_id: string;
}

export interface MetaMediaObject {
  id: string;
  mime_type: string;
  sha256?: string;
  caption?: string;
  filename?: string;
}

export interface MetaMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: MetaMediaObject;
  video?: MetaMediaObject;
  audio?: MetaMediaObject;
  document?: MetaMediaObject;
  sticker?: MetaMediaObject;
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  contacts?: unknown;
  interactive?: unknown;
  system?: { body: string };
  errors?: { code: number; title: string }[];
}

export interface MetaStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: { code: number; title: string; message?: string }[];
}

export interface MetaSendTextResponse {
  messaging_product: "whatsapp";
  contacts?: { input: string; wa_id: string }[];
  messages?: { id: string }[];
}

export interface MetaErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

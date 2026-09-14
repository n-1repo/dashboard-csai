import type { Contact, Conversation, Message } from "@/types/database";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function iso(offsetMs: number) {
  return new Date(Date.now() - offsetMs).toISOString();
}

function windowExpiry(lastCustomerMessageAt: string | null) {
  if (!lastCustomerMessageAt) return null;
  return new Date(new Date(lastCustomerMessageAt).getTime() + 24 * HOUR).toISOString();
}

export const seedContacts: Contact[] = [
  {
    id: "contact-1",
    phone_number: "+6281234567890",
    display_name: "Rina Kartika",
    profile_name: "Rina",
    avatar_url: null,
    email: "rina.kartika@example.com",
    notes: "Pelanggan lama, sering repeat order tiap bulan.",
    tags: ["vip"],
    is_blocked: false,
    created_at: iso(60 * DAY),
    updated_at: iso(2 * HOUR),
  },
  {
    id: "contact-2",
    phone_number: "+6281298765432",
    display_name: "Budi Santoso",
    profile_name: "Budi",
    avatar_url: null,
    email: null,
    notes: null,
    tags: [],
    is_blocked: false,
    created_at: iso(20 * DAY),
    updated_at: iso(5 * HOUR),
  },
  {
    id: "contact-3",
    phone_number: "+6285711122233",
    display_name: "Studio Kopi Senja",
    profile_name: "Kopi Senja",
    avatar_url: null,
    email: "hello@kopisenja.id",
    notes: "Reseller wilayah Bandung.",
    tags: ["reseller"],
    is_blocked: false,
    created_at: iso(90 * DAY),
    updated_at: iso(DAY),
  },
  {
    id: "contact-4",
    phone_number: "+6281355566677",
    display_name: "Dewi Lestari",
    profile_name: "Dewi",
    avatar_url: null,
    email: null,
    notes: null,
    tags: ["favourite"],
    is_blocked: false,
    created_at: iso(10 * DAY),
    updated_at: iso(3 * DAY),
  },
  {
    id: "contact-5",
    phone_number: "+6282199988877",
    display_name: "Agus Setiawan",
    profile_name: "Agus",
    avatar_url: null,
    email: null,
    notes: "Komplain resi belum sampai, sudah dibantu tim CS.",
    tags: [],
    is_blocked: false,
    created_at: iso(45 * DAY),
    updated_at: iso(7 * DAY),
  },
];

export const seedConversations: Conversation[] = [
  {
    id: "conv-1",
    contact_id: "contact-1",
    wa_account_id: "wa-account-demo",
    status: "OPEN",
    last_message_id: "msg-1-4",
    last_message_at: iso(15 * 60 * 1000),
    last_customer_message_at: iso(15 * 60 * 1000),
    customer_window_expires_at: windowExpiry(iso(15 * 60 * 1000)),
    unread_count: 2,
    assigned_to: null,
    created_at: iso(60 * DAY),
    updated_at: iso(15 * 60 * 1000),
  },
  {
    id: "conv-2",
    contact_id: "contact-2",
    wa_account_id: "wa-account-demo",
    status: "PENDING",
    last_message_id: "msg-2-3",
    last_message_at: iso(5 * HOUR),
    last_customer_message_at: iso(6 * HOUR),
    customer_window_expires_at: windowExpiry(iso(6 * HOUR)),
    unread_count: 0,
    assigned_to: null,
    created_at: iso(20 * DAY),
    updated_at: iso(5 * HOUR),
  },
  {
    id: "conv-3",
    contact_id: "contact-3",
    wa_account_id: "wa-account-demo",
    status: "OPEN",
    last_message_id: "msg-3-3",
    last_message_at: iso(DAY),
    last_customer_message_at: iso(21 * HOUR),
    customer_window_expires_at: windowExpiry(iso(21 * HOUR)),
    unread_count: 0,
    assigned_to: null,
    created_at: iso(90 * DAY),
    updated_at: iso(DAY),
  },
  {
    id: "conv-4",
    contact_id: "contact-4",
    wa_account_id: "wa-account-demo",
    status: "RESOLVED",
    last_message_id: "msg-4-2",
    last_message_at: iso(3 * DAY),
    last_customer_message_at: iso(4 * DAY),
    customer_window_expires_at: windowExpiry(iso(4 * DAY)),
    unread_count: 0,
    assigned_to: null,
    created_at: iso(10 * DAY),
    updated_at: iso(3 * DAY),
  },
  {
    id: "conv-5",
    contact_id: "contact-5",
    wa_account_id: "wa-account-demo",
    status: "ARCHIVED",
    last_message_id: "msg-5-2",
    last_message_at: iso(7 * DAY),
    last_customer_message_at: null,
    customer_window_expires_at: null,
    unread_count: 1,
    assigned_to: null,
    created_at: iso(45 * DAY),
    updated_at: iso(7 * DAY),
  },
];

function textMessage(
  id: string,
  conversationId: string,
  direction: Message["direction"],
  body: string,
  status: Message["status"],
  offsetMs: number,
): Message {
  return {
    id,
    conversation_id: conversationId,
    meta_message_id: `wamid.${id}`,
    direction,
    message_type: "TEXT",
    body,
    media_url: null,
    media_mime_type: null,
    caption: null,
    status,
    sender_phone: direction === "INBOUND" ? "+6281234567890" : null,
    recipient_phone: direction === "OUTBOUND" ? "+6281234567890" : null,
    timestamp: iso(offsetMs),
    raw_payload: null,
    created_at: iso(offsetMs),
  };
}

export const seedMessages: Record<string, Message[]> = {
  "conv-1": [
    textMessage("msg-1-1", "conv-1", "INBOUND", "Halo kak, produk yang kemarin masih ready?", "READ", 3 * HOUR),
    textMessage("msg-1-2", "conv-1", "OUTBOUND", "Halo Rina, masih ready kak. Mau order berapa pcs?", "READ", 2.8 * HOUR),
    textMessage("msg-1-3", "conv-1", "INBOUND", "2 pcs ya, yang warna hitam", "READ", 40 * 60 * 1000),
    textMessage("msg-1-4", "conv-1", "INBOUND", "Kalau bisa dikirim hari ini kak", "RECEIVED", 15 * 60 * 1000),
  ],
  "conv-2": [
    textMessage("msg-2-1", "conv-2", "INBOUND", "Min, cara bayar pakai QRIS bisa?", "READ", 6 * HOUR),
    textMessage("msg-2-2", "conv-2", "OUTBOUND", "Bisa kak, saya kirimkan link pembayarannya ya", "DELIVERED", 5.5 * HOUR),
    textMessage("msg-2-3", "conv-2", "OUTBOUND", "https://pay.example.com/inv/2841", "SENT", 5 * HOUR),
  ],
  "conv-3": [
    textMessage("msg-3-1", "conv-3", "INBOUND", "Kak stok biji kopi robusta 1kg berapa?", "READ", 2 * DAY),
    textMessage("msg-3-2", "conv-3", "OUTBOUND", "Untuk reseller Rp95.000/kg kak, minimal order 5kg", "READ", 1.9 * DAY),
    textMessage("msg-3-3", "conv-3", "INBOUND", "Oke, saya order 10kg bulan depan ya", "READ", DAY),
  ],
  "conv-4": [
    textMessage("msg-4-1", "conv-4", "INBOUND", "Terima kasih paketnya sudah sampai, sesuai pesanan", "READ", 3.2 * DAY),
    textMessage("msg-4-2", "conv-4", "OUTBOUND", "Sama-sama kak Dewi, ditunggu order berikutnya 🙏", "READ", 3 * DAY),
  ],
  "conv-5": [
    textMessage("msg-5-1", "conv-5", "INBOUND", "Resi saya kok belum update dari 3 hari lalu ya?", "READ", 8 * DAY),
    textMessage("msg-5-2", "conv-5", "INBOUND", "Mohon infonya kak", "RECEIVED", 7 * DAY),
  ],
};

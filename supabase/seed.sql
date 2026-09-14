insert into operators (id, email, password_hash, display_name) values
  ('00000000-0000-0000-0000-000000000001', 'operator@example.com',
   '$2b$10$XWOGN9FKb2tw/g3BUUJPO.W/.g6bC.jpqnURdORB4Z8axB3fktWGy', 'Dev Operator');

insert into wa_accounts (id, name, phone_number, phone_number_id, business_account_id, access_token, status) values
  ('00000000-0000-0000-0000-000000000010', 'Dev WhatsApp Number', '+10000000000',
   'dev-phone-number-id', 'dev-business-account-id', 'dev-access-token-placeholder', 'ACTIVE');

insert into contacts (id, phone_number, display_name, profile_name, notes, tags) values
  ('00000000-0000-0000-0000-000000000101', '+6281100000101', 'Sohan Paliyal', 'Sohan Paliyal', null, '["vip"]'),
  ('00000000-0000-0000-0000-000000000102', '+6281100000102', 'Dewi Anggraini', 'Dewi', 'Sudah resolved, tidak ada tindak lanjut.', '[]'),
  ('00000000-0000-0000-0000-000000000103', '+6281100000103', 'Budi Santoso', 'Budi', null, '["reseller"]'),
  ('00000000-0000-0000-0000-000000000104', '+6281100000104', 'Nadia Kusuma', 'Nadia', null, '[]');

insert into conversations (id, contact_id, wa_account_id, status, unread_count, last_message_at, last_customer_message_at) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', 'OPEN', 2, now() - interval '5 minutes', now() - interval '5 minutes'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010', 'RESOLVED', 0, now() - interval '2 days', now() - interval '2 days' - interval '2 minutes'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000010', 'OPEN', 0, now() - interval '1 hour', now() - interval '20 hours 30 minutes'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000010', 'PENDING', 1, now() - interval '10 minutes', now() - interval '10 minutes');

insert into messages (id, conversation_id, meta_message_id, direction, message_type, body, status, sender_phone, recipient_phone, "timestamp") values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'seed-msg-301', 'INBOUND', 'TEXT', 'Halo, akun saya kena blokir', 'RECEIVED', '+6281100000101', '+10000000000', now() - interval '10 minutes'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', 'seed-msg-302', 'INBOUND', 'TEXT', 'Mohon dibantu ya', 'RECEIVED', '+6281100000101', '+10000000000', now() - interval '5 minutes'),

  ('00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000202', 'seed-msg-310', 'INBOUND', 'TEXT', 'Terima kasih, sudah beres', 'RECEIVED', '+6281100000102', '+10000000000', now() - interval '2 days' - interval '2 minutes'),
  ('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000202', 'seed-msg-311', 'OUTBOUND', 'TEXT', 'Sama-sama, senang bisa membantu!', 'READ', '+10000000000', '+6281100000102', now() - interval '2 days'),

  ('00000000-0000-0000-0000-000000000320', '00000000-0000-0000-0000-000000000203', 'seed-msg-320', 'INBOUND', 'TEXT', 'Stok produk A masih ada?', 'RECEIVED', '+6281100000103', '+10000000000', now() - interval '65 minutes'),
  ('00000000-0000-0000-0000-000000000321', '00000000-0000-0000-0000-000000000203', 'seed-msg-321', 'OUTBOUND', 'TEXT', 'Masih tersedia, mau order berapa?', 'DELIVERED', '+10000000000', '+6281100000103', now() - interval '1 hour'),

  ('00000000-0000-0000-0000-000000000330', '00000000-0000-0000-0000-000000000204', 'seed-msg-330', 'INBOUND', 'TEXT', 'Kok pesanan saya belum sampai?', 'RECEIVED', '+6281100000104', '+10000000000', now() - interval '15 minutes'),
  ('00000000-0000-0000-0000-000000000331', '00000000-0000-0000-0000-000000000204', null, 'OUTBOUND', 'TEXT', 'Mohon maaf atas ketidaknyamanannya, kami cek dulu ya', 'FAILED', '+10000000000', '+6281100000104', now() - interval '10 minutes');

update conversations set last_message_id = '00000000-0000-0000-0000-000000000302' where id = '00000000-0000-0000-0000-000000000201';
update conversations set last_message_id = '00000000-0000-0000-0000-000000000311' where id = '00000000-0000-0000-0000-000000000202';
update conversations set last_message_id = '00000000-0000-0000-0000-000000000321' where id = '00000000-0000-0000-0000-000000000203';
update conversations set last_message_id = '00000000-0000-0000-0000-000000000331' where id = '00000000-0000-0000-0000-000000000204';

insert into message_events (message_id, event_type, payload) values
  ('00000000-0000-0000-0000-000000000301', 'MESSAGE_CREATED', '{}'),
  ('00000000-0000-0000-0000-000000000302', 'MESSAGE_CREATED', '{}'),
  ('00000000-0000-0000-0000-000000000310', 'MESSAGE_CREATED', '{}'),
  ('00000000-0000-0000-0000-000000000311', 'MESSAGE_CREATED', '{}'),
  ('00000000-0000-0000-0000-000000000311', 'MESSAGE_SENT', '{}'),
  ('00000000-0000-0000-0000-000000000311', 'MESSAGE_DELIVERED', '{}'),
  ('00000000-0000-0000-0000-000000000311', 'MESSAGE_READ', '{}'),
  ('00000000-0000-0000-0000-000000000320', 'MESSAGE_CREATED', '{}'),
  ('00000000-0000-0000-0000-000000000321', 'MESSAGE_CREATED', '{}'),
  ('00000000-0000-0000-0000-000000000321', 'MESSAGE_SENT', '{}'),
  ('00000000-0000-0000-0000-000000000321', 'MESSAGE_DELIVERED', '{}'),
  ('00000000-0000-0000-0000-000000000330', 'MESSAGE_CREATED', '{}'),
  ('00000000-0000-0000-0000-000000000331', 'MESSAGE_FAILED', '{"reason": "simulated send failure in dev seed"}');

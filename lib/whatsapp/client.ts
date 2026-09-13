import "server-only";

import type { MetaErrorResponse, MetaSendTextResponse } from "@/types/whatsapp";

function graphApiBase() {
  const version = process.env.META_GRAPH_API_VERSION ?? "v21.0";
  return `https://graph.facebook.com/${version}`;
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

export async function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string,
): Promise<MetaSendTextResponse> {
  const res = await fetch(`${graphApiBase()}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    const errorJson = json as MetaErrorResponse;
    throw new MetaApiError(errorJson.error?.message ?? "Meta API request failed", res.status);
  }

  return json as MetaSendTextResponse;
}

export async function fetchMediaMeta(mediaId: string, accessToken: string) {
  const res = await fetch(`${graphApiBase()}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new MetaApiError("Failed to resolve media metadata", res.status);
  }

  return res.json() as Promise<{ url: string; mime_type: string; file_size?: number }>;
}

export async function downloadMedia(mediaId: string, accessToken: string) {
  const meta = await fetchMediaMeta(mediaId, accessToken);

  const res = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok || !res.body) {
    throw new MetaApiError("Failed to download media", res.status);
  }

  return { body: res.body, contentType: meta.mime_type };
}

import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";

interface StoredContract extends SharePayload {
  shortId: string;
  savedAt: number;
  expiresAt: number | null;
}

interface SharePayload {
  id: string;
  createdAt: number;
  version: number;
  templateId?: string;
  templateName?: string;
  templateContent?: string;
  enabledSections?: string[];
  formData: unknown;
  content?: string;
}

const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SHORT_ID_LENGTH = 8;

const generateShortId = (): string => {
  const random = randomBytes(SHORT_ID_LENGTH);
  let id = "";

  for (let i = 0; i < random.length; i += 1) {
    id += BASE62_CHARS[random[i] % BASE62_CHARS.length];
  }

  return id;
};

export default async (request: Request, _context: Context): Promise<Response> => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const payload = (await request.json()) as SharePayload;

    const store = getStore({
      name: "contracts",
      consistency: "strong",
    });

    let shortId = "";
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const candidate = generateShortId();
      const existing = await store.get(candidate);

      if (!existing) {
        shortId = candidate;
        break;
      }
    }

    if (!shortId) {
      throw new Error("Unable to allocate unique short id");
    }

    const now = Date.now();

    const record: StoredContract = {
      ...payload,
      shortId,
      savedAt: now,
      expiresAt: null,
    };

    await store.set(shortId, JSON.stringify(record));

    const origin = new URL(request.url).origin;
    const url = `${origin}?id=${shortId}`;

    return new Response(
      JSON.stringify({
        success: true,
        shortId,
        url,
        urlLength: url.length,
        savedAt: now,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("save-contract error", error);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/save-contract",
};

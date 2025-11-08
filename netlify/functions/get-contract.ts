import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const SHORT_ID_PATTERN = /^[0-9A-Za-z]{8}$/;

export default async (request: Request, _context: Context): Promise<Response> => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing id parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!SHORT_ID_PATTERN.test(id)) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid id format" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const store = getStore({ name: "contracts", consistency: "strong" });
    const stored = await store.get(id);

    if (!stored) {
      return new Response(
        JSON.stringify({ success: false, error: "Contract not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(stored, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("get-contract error", error);
    const message = error instanceof Error ? error.message : "Unknown error";

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
  path: "/api/get-contract",
};

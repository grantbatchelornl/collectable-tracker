import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function mapModel(model?: string) {
  // COLLECTABLE previously used Base44 model aliases.
  // Route them to the current stable Gemini model.
  return "gemini-3.6-flash";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      prompt,
      file_urls = [],
      response_json_schema,
      model,
    } = body || {};

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parts: any[] = [{ text: prompt }];

    for (const url of file_urls) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;

        const bytes = new Uint8Array(await r.arrayBuffer());
        let binary = "";
        for (const b of bytes) binary += String.fromCharCode(b);

        parts.push({
          inline_data: {
            mime_type: r.headers.get("content-type") || "image/jpeg",
            data: btoa(binary),
          },
        });
      } catch {
        // Ignore individual image fetch failures.
      }
    }

    const generationConfig: Record<string, any> = {};

    if (response_json_schema) {
      generationConfig.response_mime_type = "application/json";
      generationConfig.response_schema = response_json_schema;
    }

    const geminiModel = mapModel(model);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text =
      result?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || "")
        .join("") || "";

    let output: any = text;

    if (response_json_schema) {
      try {
        output = JSON.parse(text);
      } catch {
        output = {
          error: "Model returned invalid JSON",
          raw: text,
        };
      }
    }

    return new Response(JSON.stringify(output), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

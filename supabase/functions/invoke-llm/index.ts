import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

const MAX_ATTEMPTS = 2;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

async function callGemini(payload: Record<string, unknown>) {
  let lastFailure: any = null;

  for (const model of GEMINI_MODELS) {
    let lastStatus = 503;
    let lastResult: any = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`[invoke-llm] Calling ${model}, attempt ${attempt}/${MAX_ATTEMPTS}`);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": GEMINI_API_KEY!,
            },
            body: JSON.stringify(payload),
          },
        );

        lastStatus = response.status;

        try {
          lastResult = await response.json();
        } catch {
          lastResult = {
            error: { message: `Gemini returned HTTP ${response.status}` },
          };
        }

        if (response.ok) {
          console.log(`[invoke-llm] ${model} succeeded on attempt ${attempt}`);

          return {
            ok: true,
            status: response.status,
            result: lastResult,
            model,
            attempts: attempt,
          };
        }

        console.warn(
          `[invoke-llm] ${model} attempt ${attempt}/${MAX_ATTEMPTS} returned HTTP ${response.status}`,
        );

        if (!isRetryableStatus(response.status)) {
          break;
        }

        if (attempt < MAX_ATTEMPTS) {
          const delay =
            750 * Math.pow(2, attempt - 1) +
            Math.floor(Math.random() * 300);

          await sleep(delay);
        }
      } catch (error) {
        lastStatus = 503;

        lastResult = {
          error: {
            message:
              error instanceof Error
                ? error.message
                : "Network error while contacting Gemini",
          },
        };

        console.warn(
          `[invoke-llm] ${model} network failure on attempt ${attempt}/${MAX_ATTEMPTS}`,
        );

        if (attempt < MAX_ATTEMPTS) {
          const delay =
            750 * Math.pow(2, attempt - 1) +
            Math.floor(Math.random() * 300);

          await sleep(delay);
        }
      }
    }

    lastFailure = {
      ok: false,
      status: lastStatus,
      result: lastResult,
      model,
      attempts: MAX_ATTEMPTS,
    };

    console.warn(
      `[invoke-llm] ${model} unavailable with HTTP ${lastStatus}; trying next model`,
    );

    if (lastStatus === 401 || lastStatus === 403) {
      break;
    }
  }

  return (
    lastFailure || {
      ok: false,
      status: 503,
      result: null,
      model: null,
      attempts: 0,
    }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
    );
  }

  try {
    if (!GEMINI_API_KEY) {
      console.error(
        "[invoke-llm] GEMINI_API_KEY is not configured",
      );

      return jsonResponse(
        {
          error: "Collector AI is not configured.",
          retryable: false,
        },
        500,
      );
    }

    const body = await req.json();

    const {
      prompt,
      file_urls = [],
      response_json_schema,
    } = body || {};

    if (!prompt || typeof prompt !== "string") {
      return jsonResponse(
        {
          error: "prompt is required",
          retryable: false,
        },
        400,
      );
    }

    const parts: any[] = [
      {
        text: prompt,
      },
    ];

    if (Array.isArray(file_urls)) {
      for (const url of file_urls) {
        if (!url || typeof url !== "string") {
          continue;
        }

        try {
          const imageResponse = await fetch(url);

          if (!imageResponse.ok) {
            console.warn(
              `[invoke-llm] Image fetch returned HTTP ${imageResponse.status}`,
            );
            continue;
          }

          const bytes = new Uint8Array(
            await imageResponse.arrayBuffer(),
          );

          let binary = "";

          for (const byte of bytes) {
            binary += String.fromCharCode(byte);
          }

          parts.push({
            inline_data: {
              mime_type:
                imageResponse.headers.get("content-type") ||
                "image/jpeg",
              data: btoa(binary),
            },
          });
        } catch (error) {
          console.warn(
            "[invoke-llm] Ignoring image fetch failure:",
            error instanceof Error
              ? error.message
              : String(error),
          );
        }
      }
    }

    const generationConfig: Record<string, any> = {};

    if (response_json_schema) {
      generationConfig.response_mime_type =
        "application/json";

      generationConfig.response_schema =
        response_json_schema;
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig,
    };

    const call = await callGemini(payload);

    if (!call.ok) {
      console.error(
        `[invoke-llm] Gemini failed after ${call.attempts} attempt(s). Final HTTP status: ${call.status}`,
      );

      /*
       * Do not expose Google's raw response to the browser.
       * Keep the useful details in Edge Function logs instead.
       */
      console.error(
        "[invoke-llm] Upstream response:",
        JSON.stringify(call.result),
      );

      if (isRetryableStatus(call.status)) {
        return jsonResponse(
          {
            error:
              "Collector AI is temporarily busy. Please try again in a moment.",
            retryable: true,
          },
          503,
        );
      }

      return jsonResponse(
        {
          error:
            "Collector AI could not complete that request.",
          retryable: false,
        },
        502,
      );
    }

    const result = call.result;

    const text =
      result?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text || "")
        .join("")
        .trim() || "";

    if (!text) {
      console.error(
        "[invoke-llm] Gemini returned no usable response text",
      );

      return jsonResponse(
        {
          error:
            "Collector AI did not receive a usable response. Please try again.",
          retryable: true,
        },
        502,
      );
    }

    if (!response_json_schema) {
      return jsonResponse(text, 200);
    }

    try {
      const parsed = JSON.parse(text);

      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          "Structured response was not a JSON object",
        );
      }

      return jsonResponse(parsed, 200);
    } catch (error) {
      console.error(
        "[invoke-llm] Gemini returned invalid structured JSON:",
        error instanceof Error
          ? error.message
          : String(error),
      );

      console.error(
        "[invoke-llm] Invalid response preview:",
        text.slice(0, 500),
      );

      return jsonResponse(
        {
          error:
            "Collector AI returned an invalid response. Please try again.",
          retryable: true,
        },
        502,
      );
    }
  } catch (error) {
    console.error(
      "[invoke-llm] Unexpected failure:",
      error instanceof Error
        ? error.message
        : String(error),
    );

    return jsonResponse(
      {
        error:
          "Collector AI encountered an unexpected error. Please try again.",
        retryable: true,
      },
      500,
    );
  }
});
const MAX_BYTES = 3_000_000;

const schema = {
  type: "object",
  properties: {
    case_id: { type: "string", description: "Explicit case or application identifier." },
    document_type: { type: "string", description: "Document type exactly as supported by the source." },
    applicant: { type: "string", description: "Named applicant or subject exactly as written." },
    program: { type: "string", description: "Program, service, benefit, or process named in the source." },
    decision_date: { type: "string", description: "Decision or notice date as written in the source." },
    benefit_amount: { type: "string", description: "Explicitly stated amount preserving currency and formatting." },
    reference_number: { type: "string", description: "Reference, notice, or tracking number." },
    review_status: { type: "string", description: "Explicit review, hold, approval, pending, or manual-review status." },
    verified_evidence: { type: "array", items: { type: "string" }, description: "Evidence explicitly marked verified, complete, accepted, or present." },
    missing_evidence: { type: "array", items: { type: "string" }, description: "Evidence explicitly marked missing, pending, incomplete, or required." },
    decision_note: { type: "string", description: "Decision/release note preserving source meaning without inference." }
  },
  required: ["case_id","document_type","applicant","program","decision_date","benefit_amount","reference_number","review_status","verified_evidence","missing_evidence","decision_note"]
};

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
};

const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return reply(405, { ok: false, error: "POST required" });
  const apiKey = process.env.NUTRIENT_API_KEY;
  if (!apiKey) return reply(503, { ok: false, error: "Nutrient DWS is not configured" });

  try {
    const input = JSON.parse(event.body || "{}");
    const { fileBase64, fileName = "document", mimeType = "application/octet-stream" } = input;
    if (!fileBase64 || typeof fileBase64 !== "string") return reply(400, { ok: false, error: "Document payload is required" });

    const bytes = Buffer.from(fileBase64, "base64");
    if (!bytes.length) return reply(400, { ok: false, error: "Empty document" });
    if (bytes.length > MAX_BYTES) return reply(413, { ok: false, error: "Demo limit is 3 MB" });

    const form = new FormData();
    form.append("file", new Blob([bytes], { type: mimeType }), String(fileName).slice(0, 180));
    form.append("instructions", JSON.stringify({
      schema,
      instructions: "Extract only values explicitly supported by the source document. Never infer missing facts. Preserve source wording and currency. Return empty strings or arrays when a field is absent. Missing or pending evidence must be captured in missing_evidence, not guessed."
    }));

    const upstream = await fetch("https://api.nutrient.io/extraction/extract", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });

    const text = await upstream.text();
    let result;
    try { result = JSON.parse(text); } catch { result = { raw: text.slice(0, 20000) }; }

    if (!upstream.ok) return reply(upstream.status, { ok: false, error: "Nutrient DWS extraction failed", result });

    return reply(200, {
      ok: true,
      provider: "Nutrient DWS Data Extraction API",
      receivedAt: new Date().toISOString(),
      result
    });
  } catch {
    return reply(500, { ok: false, error: "Extraction gateway error" });
  }
};

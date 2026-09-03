# EvidenceReady

**AI does the reading. Humans own the decision.**

EvidenceReady is a human-in-the-loop document evidence gate built for the **Nutrient DWS Challenge** at DevNetwork [API + Cloud + AI] Hackathon 2026. It turns messy regulated documents into structured, source-grounded evidence, routes uncertainty to a person, and exports an auditable release record.

> **Where Nutrient does the heavy lifting:** Nutrient DWS converts messy documents into schema-mapped, source-grounded structured evidence; EvidenceReady uses those results to route uncertainty to a human and preserve an auditable release record.

## The problem

Document-heavy workflows often fail in the last mile. AI can read a PDF quickly, but a plausible extraction is not the same thing as verified evidence. In legal, public-service, compliance, claims, finance, and similar workflows, a missing document or uncertain field can change the outcome.

EvidenceReady deliberately separates **extraction** from **release**:

```text
document
  → source SHA-256 + metadata
  → Nutrient DWS schema extraction
  → confidence/source evidence inspection
  → exception routing
  → mandatory human review
  → approved audit JSON
```

The app does **not** make legal, eligibility, lending, insurance, medical, or benefits decisions.

## 30-second judge test

1. Open the live deployment.
2. Click **Load synthetic case**.
3. Confirm the source hash and file metadata appear.
4. Click **Extract with Nutrient DWS**.
5. Inspect the typed fields and the raw DWS evidence.
6. Confirm the synthetic case's missing proof of residence is routed to **Human review**.
7. Notice that **Approve release pack** remains disabled until all three human checks are completed.
8. Approve the pack and download the audit JSON.

The bundled example is synthetic and contains no real person's data.

## What the prototype demonstrates

- Browser-side SHA-256 source fingerprinting.
- Real server-side call to the **Nutrient DWS Data Extraction API**.
- Explicit JSON Schema for case/document/evidence fields.
- Source-grounded extraction instructions: absent facts must remain absent, never inferred.
- Detection of missing evidence, explicit manual-review states, and low-confidence output.
- Human review checklist before release approval.
- Timestamped audit events and source hash in the exported JSON pack.
- API secret kept server-side.
- No database and no analytics SDK.

## Nutrient DWS integration

The serverless gateway in [`api/extract.js`](api/extract.js) calls:

```text
POST https://api.nutrient.io/extraction/extract
```

with the uploaded document plus a typed extraction schema. The browser never receives the Nutrient API key.

The schema requests:

- case/application ID
- document type
- applicant/subject
- program/service
- decision date
- stated amount
- reference number
- review status
- verified evidence
- missing/pending evidence
- source decision note

Extraction instructions explicitly prohibit inventing missing facts and preserve source wording/currency.

## Human-control design

EvidenceReady never treats a model response as a final decision. A review gate is triggered when, for example:

- the source explicitly says `manual review`, `pending`, or `hold`;
- evidence is missing or incomplete;
- a confidence signal is below the demo threshold.

A human must confirm all three release checks:

1. extracted values were checked against the source;
2. missing/pending evidence was reviewed;
3. no inferred facts were accepted as source evidence.

Only then can the audit pack be marked approved.

## Architecture

```text
Browser
  ├─ file selection / synthetic fixture
  ├─ SHA-256 source lock
  └─ POST /api/extract
          │
          ▼
Vercel serverless gateway
  ├─ size + method validation
  ├─ server-side NUTRIENT_API_KEY
  └─ multipart request
          │
          ▼
Nutrient DWS Data Extraction API
          │
          ▼
structured evidence + source context/confidence
          │
          ▼
Browser review gate
  ├─ exceptions
  ├─ human confirmation
  └─ audit JSON export
```

## Privacy and safety

- **No API key in frontend or repository.**
- API response uses `Cache-Control: no-store`.
- No application database.
- No third-party analytics.
- Demo upload limit: 3 MB.
- Security headers are configured in [`vercel.json`](vercel.json).
- Demo uses only synthetic data.
- This prototype organizes evidence; it is not a decision engine.

For a production deployment, regulated or sensitive documents would require an organization-specific DPIA/security review, retention policy, regional hosting decision, access controls, and appropriate contractual/legal safeguards.

## Run locally

The static UI can be viewed with:

```bash
python -m http.server 8080
```

The real DWS extraction path requires a serverless/runtime environment with:

```text
NUTRIENT_API_KEY=<your Nutrient DWS key>
```

For the deployed demo this secret is configured only in the hosting environment. **Never commit it.**

## Deployment

The repository is designed for Vercel:

1. Import this GitHub repository into Vercel.
2. Add `NUTRIENT_API_KEY` as an Environment Variable.
3. Deploy.
4. Verify `/api/extract` returns `405` for GET and accepts only POST document payloads.

No paid dependency is required for the hackathon demo; the integration uses Nutrient's free Data Extraction credits and a free hosting tier.

## Judging alignment

### Progress

A complete vertical slice is implemented: real document upload, real DWS extraction, review routing, human approval, and audit export — rather than a slide-only concept.

### Concept

The product targets a concrete failure mode in AI document automation: **correct-looking output that has not yet been verified as evidence**. The human gate is part of the product architecture, not a disclaimer added afterward.

### Feasibility

The prototype is intentionally small and deployable: static frontend + one serverless endpoint + Nutrient DWS. The same pattern can be extended to document intake for compliance, public services, legal operations, claims, procurement, onboarding, and regulated back-office workflows.

## Repository map

- [`index.html`](index.html) — UI, source hash, exception routing, human review, audit export
- [`api/extract.js`](api/extract.js) — secret-preserving Nutrient DWS gateway
- [`vercel.json`](vercel.json) — deployment/security configuration
- [`QA.md`](QA.md) — reproducible acceptance evidence
- [`LICENSE`](LICENSE) — MIT

## Hackathon compliance

- Built during the active DevNetwork hackathon window on **2026-09-03**.
- Solo project.
- Public source repository.
- Meaningful Nutrient DWS Data Extraction integration.
- No paid service purchase required.
- Synthetic test material only.

## License

MIT.

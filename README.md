This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Mock login (patient & staff)

The patient portal (`/login`) and backoffice (`/backoffice-login`) flows are gated with a shared demo password:

**`Test!1`**

You can change it in `src/lib/login-gate.ts`.

## Patient portal: next actions (mock)

The treatment request overview (`/[locale]/profile/treatment`) shows a **Next action** card with **only patient-executable** steps: deep links (onboarding, **Files**, **Quotes**) or **dialogs** that mirror the onboarding stepper (request callback with preferred time window, book consultation via `ConsultationBookingForm`, order ground transport from the package stay with per-trip summary, confirm arrival in country, confirm check-in at stay). For **B2C** leads at **`quotation_accepted`** or **`booking`**, if the active quotation still needs proof, the primary CTA can be **upload down payment proof** or **upload remaining payment proof** (same document types as the Quotes/Files flows), opened via `DocumentUploadDialog` before arrival/transport steps. An **Upcoming event** card appears only when mock data defines an event for that lead. Logic is **mock-only** and intended to be replaced by a backend later. No extra `LeadStatus` values were added; readiness is inferred from quotation totals and uploaded document types.

### Where it lives

| Piece | Location |
|-------|----------|
| Task + event data and rules | `src/lib/patient-next-action.ts` |
| Overview UI (cards, tabs, map link) | `src/app/[locale]/(patient-portal)/profile/treatment/_components/patient-treatment-detail-tabs.tsx` |
| Next-action dialogs (callback, book call, car, arrivals, payment proofs) | `src/app/[locale]/(patient-portal)/profile/treatment/_components/patient-next-action-modals.tsx` (payment modals reuse `src/components/leads/document-upload-dialog.tsx`) |
| Consultation slots for the book-call modal | Loaded on the server in `profile/treatment/page.tsx` via `listAvailableSlots` + `getConsultantProfile` (same pattern as onboarding) |
| CRM settings explainer (Leads tab) | `src/app/[locale]/(crm)/crm/settings/_components/crm-settings-form.tsx` (copy under `crm.settingsNextAction*` in `messages/*.json`) |

### Next action task (by `LeadStatus`, English intent)

Each row describes the **primary** CTA. CTAs use `portal.*` titles; modal copy uses `portal.nextActionModal*`. Treatment URLs append `?patient=…` for demo patient switching.

| `LeadStatus` | What the patient can do | CTA shape |
|--------------|-------------------------|-----------|
| `new` | Finish the care request in onboarding | Link → `/onboarding` |
| `interested` | Book a consultation call | Modal → booking form (stepper parity) |
| `estimate_requested` | Upload missing mandatory documents | Link → `?tab=files` |
| `estimate_requested` (no pending mandatory docs) | Ask the team to call back | Modal → callback |
| `estimate_reviewed` | Open quotations when a non-draft quote exists | Link → `?tab=quotes` |
| `estimate_reviewed` (no visible quotation yet) | Request a callback while the quote is prepared | Modal → callback |
| `quotation_sent` | Review / accept quotations | Link → `?tab=quotes` |
| `quotation_sent` (no visible quotation yet) | Request a callback | Modal → callback |
| `changes_requested` | Request a callback about revisions | Modal → callback |
| `quotation_accepted` | Confirm arrival in the treatment destination | Modal → arrival-in-country |
| `quotation_accepted` (B2C, accepted quote, down payment proof missing) | Upload proof of down payment | Modal → document upload (`payment_proof_downpayment`) |
| `quotation_accepted` (B2C, down proof OK or not required, remaining balance above zero, remaining proof missing) | Upload proof of remaining payment | Modal → document upload (`payment_proof_remaining`) |
| `booking` | Request package ground transport from the stay (trips → hospital/doctor) | Modal → order car |
| `booking` (B2C, same payment-proof rules as above) | Same payment upload modals when proofs are still missing | Modal → document upload |
| `arrived` | Confirm check-in at package accommodation | Modal → arrival at stay |
| `in_treatment` / `completed` / `lost` | Request a callback from care coordination | Modal → callback |

### Overrides

1. **Payment proof uploads (B2C, `quotation_accepted` / `booking`)** — If the picked quotation (`accepted` first, else active non-draft, else latest `sent_to_patient`) has an outstanding down payment or remaining balance and the corresponding `payment_proof_*` document is not yet `uploaded` or `verified`, that upload modal becomes the **primary** next action (before arrival, transport, or CRM callback). **B2B** demo leads skip this branch so booking-stage transport stays the default.
2. **CRM accepted quotation on behalf of patient** — If `statusHistory` contains `PATIENT_ACCEPTS_QUOTATION` with `actorRole !== "patient"` and status is `quotation_accepted` or `booking`, the CTA becomes **request a callback** (coordination update) instead of arrival/transport actions **once payment proofs are satisfied** (`src/lib/services/state-machine.service.ts` describes the pipeline event).
3. **`estimate_requested` but no pending mandatory documents** — Callback modal (patient cannot upload more required items in this mock).
4. **`estimate_reviewed` or `quotation_sent` but no non-draft quotation** — Callback modal while waiting for the formal quote.

### Upcoming events (mock, by lead id)

Optional second card content is **not** driven by status: it is keyed by **`lead.id`** in `EVENT_BY_LEAD_ID` inside `patient-next-action.ts` (demo seeds such as `lead_1`, `lead_8`, `lead_9`, `lead_10`). Leads without an entry **do not show** the Upcoming event card.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

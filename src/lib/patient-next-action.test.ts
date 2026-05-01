import { describe, expect, it } from "vitest";
import { PIPELINE_MOCK_SEED } from "@/lib/api/leads-pipeline-seed";
import { getPatientNextActionPlan } from "@/lib/patient-next-action";
import type { Lead } from "@/types";

function leadById(id: string) {
  const lead = PIPELINE_MOCK_SEED.find((l) => l.id === id);
  if (!lead) throw new Error(`missing ${id}`);
  return lead;
}

describe("getPatientNextActionPlan", () => {
  it("uses link to onboarding for new leads", () => {
    const plan = getPatientNextActionPlan(leadById("lead_2"));
    expect(plan.task.cta).toEqual({ kind: "link", href: "/onboarding" });
  });

  it("uses book_call modal for interested leads", () => {
    const plan = getPatientNextActionPlan(leadById("lead_3"));
    expect(plan.task.cta).toEqual({ kind: "modal", modalId: "book_call" });
  });

  it("uses files tab when mandatory documents are pending", () => {
    const base = leadById("lead_4");
    const lead: Lead = {
      ...base,
      status: "estimate_requested",
      documents: [
        {
          id: "doc_pending",
          type: "medical_report",
          name: "Medical report",
          mandatory: true,
          status: "pending",
        },
      ],
    };
    const plan = getPatientNextActionPlan(lead);
    expect(plan.task.cta).toEqual({ kind: "link", href: "/profile/treatment?tab=files" });
  });

  it("uses request_callback modal when files are complete at estimate_requested", () => {
    const lead = {
      ...leadById("lead_4"),
      documents: leadById("lead_4").documents.map((d) =>
        d.mandatory ? { ...d, status: "uploaded" as const } : d,
      ),
    };
    const plan = getPatientNextActionPlan(lead);
    expect(plan.task.cta).toEqual({ kind: "modal", modalId: "request_callback" });
  });

  it("uses quotes tab when a non-draft quotation exists", () => {
    const plan = getPatientNextActionPlan(leadById("lead_1"));
    expect(plan.task.cta).toEqual({ kind: "link", href: "/profile/treatment?tab=quotes" });
  });

  it("uses order_car modal at booking stage", () => {
    const plan = getPatientNextActionPlan(leadById("lead_8"));
    expect(plan.task.cta).toEqual({ kind: "modal", modalId: "order_car" });
  });

  it("uses upload_payment_downpayment at quotation_accepted for b2c when proof is missing", () => {
    const plan = getPatientNextActionPlan(leadById("lead_7"));
    expect(plan.task.cta).toEqual({ kind: "modal", modalId: "upload_payment_downpayment" });
  });

  it("uses upload_payment_remaining after down payment proof exists", () => {
    const base = leadById("lead_7");
    const lead: Lead = {
      ...base,
      documents: [
        ...base.documents,
        {
          id: "doc_dp_proof",
          type: "payment_proof_downpayment",
          name: "down.pdf",
          mandatory: false,
          status: "uploaded",
          uploadedAt: new Date().toISOString(),
        },
      ],
    };
    const plan = getPatientNextActionPlan(lead);
    expect(plan.task.cta).toEqual({ kind: "modal", modalId: "upload_payment_remaining" });
  });

  it("falls back to arrival modal when both payment proofs exist at quotation_accepted", () => {
    const base = leadById("lead_7");
    const lead: Lead = {
      ...base,
      documents: [
        ...base.documents,
        {
          id: "doc_dp_proof",
          type: "payment_proof_downpayment",
          name: "down.pdf",
          mandatory: false,
          status: "uploaded",
          uploadedAt: new Date().toISOString(),
        },
        {
          id: "doc_rem_proof",
          type: "payment_proof_remaining",
          name: "rem.pdf",
          mandatory: false,
          status: "uploaded",
          uploadedAt: new Date().toISOString(),
        },
      ],
    };
    const plan = getPatientNextActionPlan(lead);
    expect(plan.task.cta).toEqual({ kind: "modal", modalId: "report_arrival_travel" });
  });

  it("prioritizes down payment proof at booking for b2c over transport", () => {
    const lead: Lead = { ...leadById("lead_8"), clientType: "b2c" };
    const plan = getPatientNextActionPlan(lead);
    expect(plan.task.cta).toEqual({ kind: "modal", modalId: "upload_payment_downpayment" });
  });

  it("prefers CRM callback when payment proofs are complete and CRM accepted the quote", () => {
    const base = leadById("lead_7");
    const lead: Lead = {
      ...base,
      statusHistory: [
        {
          from: "quotation_sent",
          to: "quotation_accepted",
          action: "PATIENT_ACCEPTS_QUOTATION",
          actorRole: "cs",
          actorId: "cs_sara",
          timestamp: new Date().toISOString(),
        },
      ],
      documents: [
        ...base.documents,
        {
          id: "doc_dp_proof",
          type: "payment_proof_downpayment",
          name: "down.pdf",
          mandatory: false,
          status: "uploaded",
          uploadedAt: new Date().toISOString(),
        },
        {
          id: "doc_rem_proof",
          type: "payment_proof_remaining",
          name: "rem.pdf",
          mandatory: false,
          status: "uploaded",
          uploadedAt: new Date().toISOString(),
        },
      ],
    };
    const plan = getPatientNextActionPlan(lead);
    expect(plan.task.cta).toEqual({ kind: "modal", modalId: "request_callback" });
  });

  it("uses report_arrival_stay modal at arrived", () => {
    const plan = getPatientNextActionPlan(leadById("lead_9"));
    expect(plan.task.cta).toEqual({ kind: "modal", modalId: "report_arrival_stay" });
  });
});

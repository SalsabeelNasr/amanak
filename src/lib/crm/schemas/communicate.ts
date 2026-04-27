import { z } from "zod";

export const COMMUNICATE_DIALOG_MODES = [
  "log_call",
  "app_call",
  "whatsapp",
  "email",
  "sms",
] as const;

export type CommunicateDialogMode = (typeof COMMUNICATE_DIALOG_MODES)[number];

export type CommunicateFormValues = {
  whenLocal: string;
  callNotes: string;
  waMessage: string;
  emailSubject: string;
  emailBody: string;
  smsMessage: string;
};

export function getDefaultCommunicateFormValues(
  toWhenLocal: () => string,
): CommunicateFormValues {
  return {
    whenLocal: toWhenLocal(),
    callNotes: "",
    waMessage: "",
    emailSubject: "",
    emailBody: "",
    smsMessage: "",
  };
}

function whenField(invalidWhen: string) {
  return z
    .string()
    .min(1, invalidWhen)
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: invalidWhen });
}

type CommunicateFormMessages = {
  when: string;
  callNotes: string;
  message: string;
  emailFields: string;
  noPatientEmail: string;
  noPatientPhone: string;
};

/** Validated for current compose tab; `app_call` is permissive (not submitted from this dialog). */
export function createCommunicateFormSchema(options: {
  mode: CommunicateDialogMode;
  messages: CommunicateFormMessages;
  hasPatientEmail: boolean;
  hasPatientPhone: boolean;
}) {
  const { mode, messages, hasPatientEmail, hasPatientPhone } = options;

  if (mode === "app_call") {
    return z.object({
      whenLocal: z.string(),
      callNotes: z.string(),
      waMessage: z.string(),
      emailSubject: z.string(),
      emailBody: z.string(),
      smsMessage: z.string(),
    });
  }

  const base = z.object({
    whenLocal: whenField(messages.when),
    callNotes: z.string(),
    waMessage: z.string(),
    emailSubject: z.string(),
    emailBody: z.string(),
    smsMessage: z.string(),
  });

  if (mode === "log_call") {
    return base.refine((d) => d.callNotes.trim().length > 0, {
      path: ["callNotes"],
      message: messages.callNotes,
    });
  }

  if (mode === "whatsapp") {
    return base.refine((d) => d.waMessage.trim().length > 0, {
      path: ["waMessage"],
      message: messages.message,
    });
  }

  if (mode === "sms") {
    return base.superRefine((d, ctx) => {
      if (!hasPatientPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["smsMessage"],
          message: messages.noPatientPhone,
        });
        return;
      }
      if (!d.smsMessage.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["smsMessage"],
          message: messages.message,
        });
      }
    });
  }

  return base.superRefine((d, ctx) => {
    if (!hasPatientEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emailBody"],
        message: messages.noPatientEmail,
      });
      return;
    }
    if (!d.emailSubject.trim() || !d.emailBody.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emailBody"],
        message: messages.emailFields,
      });
    }
  });
}

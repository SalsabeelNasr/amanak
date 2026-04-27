import { describe, expect, it } from "vitest";
import { formatLeadTaskCreationFailure } from "./lead-task-creation-messages";

describe("formatLeadTaskCreationFailure", () => {
  it("maps title_required", () => {
    const t = (key: string) =>
      key === "taskValidationTitleRequired" ? "Enter a task title." : key;
    expect(
      formatLeadTaskCreationFailure(t, { code: "title_required" }),
    ).toBe("Enter a task title.");
  });
});

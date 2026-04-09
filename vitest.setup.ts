import "@testing-library/jest-dom/vitest";

/** Stabilize calendar-day logic in unit tests (e.g. CRM “today” digest). */
process.env.TZ = "UTC";

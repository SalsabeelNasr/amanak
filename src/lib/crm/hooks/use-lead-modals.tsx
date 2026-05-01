"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
type ModalState =
  | { open: null; payload?: undefined }
  | { open: "task-detail"; payload: { taskId: string } }
  | { open: "task-add" }
  | { open: "communicate" }
  | { open: "quotation-wizard" }
  | { open: "status-change" }
  | { open: "confirm-transition" }
  | { open: "owner" }
  | { open: "due-date" };

type LeadModalsValue = {
  state: ModalState;
  openTaskDetail: (taskId: string) => void;
  openTaskAdd: () => void;
  openCommunicate: () => void;
  openQuotationWizard: () => void;
  openStatusChange: () => void;
  openConfirmTransition: () => void;
  openOwner: () => void;
  openDueDate: () => void;
  close: () => void;
};

const LeadModalsContext = createContext<LeadModalsValue | null>(null);

export function LeadModalsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>({ open: null });

  const openTaskDetail = useCallback((taskId: string) => {
    setState({ open: "task-detail", payload: { taskId } });
  }, []);

  const openTaskAdd = useCallback(() => {
    setState({ open: "task-add" });
  }, []);

  const openCommunicate = useCallback(() => {
    setState({ open: "communicate" });
  }, []);

  const openQuotationWizard = useCallback(() => {
    setState({ open: "quotation-wizard" });
  }, []);

  const openStatusChange = useCallback(() => {
    setState({ open: "status-change" });
  }, []);

  const openConfirmTransition = useCallback(() => {
    setState({ open: "confirm-transition" });
  }, []);

  const openOwner = useCallback(() => {
    setState({ open: "owner" });
  }, []);

  const openDueDate = useCallback(() => {
    setState({ open: "due-date" });
  }, []);

  const close = useCallback(() => {
    setState({ open: null });
  }, []);

  const value = useMemo<LeadModalsValue>(
    () => ({
      state,
      openTaskDetail,
      openTaskAdd,
      openCommunicate,
      openQuotationWizard,
      openStatusChange,
      openConfirmTransition,
      openOwner,
      openDueDate,
      close,
    }),
    [
      state,
      openTaskDetail,
      openTaskAdd,
      openCommunicate,
      openQuotationWizard,
      openStatusChange,
      openConfirmTransition,
      openOwner,
      openDueDate,
      close,
    ],
  );

  return (
    <LeadModalsContext.Provider value={value}>
      {children}
    </LeadModalsContext.Provider>
  );
}

export function useLeadModals(): LeadModalsValue {
  const ctx = useContext(LeadModalsContext);
  if (!ctx) {
    throw new Error("useLeadModals must be used within LeadModalsProvider");
  }
  return ctx;
}

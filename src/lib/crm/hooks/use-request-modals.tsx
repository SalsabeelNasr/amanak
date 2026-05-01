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

export type RequestModalsValue = {
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

/** @deprecated Use {@link RequestModalsValue} */
export type LeadModalsValue = RequestModalsValue;

const RequestModalsContext = createContext<RequestModalsValue | null>(null);

export function RequestModalsProvider({ children }: { children: ReactNode }) {
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

  const value = useMemo<RequestModalsValue>(
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
    <RequestModalsContext.Provider value={value}>{children}</RequestModalsContext.Provider>
  );
}

/** @deprecated Use {@link RequestModalsProvider} */
export const LeadModalsProvider = RequestModalsProvider;

export function useRequestModals(): RequestModalsValue {
  const ctx = useContext(RequestModalsContext);
  if (!ctx) {
    throw new Error("useRequestModals must be used within RequestModalsProvider");
  }
  return ctx;
}

/** @deprecated Use {@link useRequestModals} */
export const useLeadModals = useRequestModals;

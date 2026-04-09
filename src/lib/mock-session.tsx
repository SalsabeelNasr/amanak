"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MockSession, MockUser } from "@/types";

export { MOCK_USERS } from "./mock-users";

type SessionContextValue = {
  session: MockSession;
  login: (user: MockUser) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const INITIAL: MockSession = { isAuthenticated: false, user: null };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MockSession>(INITIAL);

  const login = useCallback((user: MockUser) => {
    setSession({ isAuthenticated: true, user });
  }, []);

  const logout = useCallback(() => {
    setSession(INITIAL);
  }, []);

  const value = useMemo(
    () => ({ session, login, logout }),
    [session, login, logout],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}

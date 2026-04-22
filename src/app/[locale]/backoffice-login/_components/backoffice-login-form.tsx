"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLoginGatePassword } from "@/lib/login-gate";
import { ROUTES } from "@/lib/routes";
import { MOCK_USERS, useSession } from "@/lib/mock-session";

export function BackofficeLoginForm() {
  const t = useTranslations("auth");
  const { login } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  function handleLogin() {
    if (!isLoginGatePassword(password)) {
      setPasswordError(true);
      return;
    }
    const admin = MOCK_USERS.find((u) => u.role === "admin");
    if (!admin) return;
    login(admin);
    router.push(ROUTES.crmDashboard);
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="backoffice-login-password">{t("passwordLabel")}</Label>
            <Input
              id="backoffice-login-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              autoComplete="current-password"
              aria-invalid={passwordError}
            />
            {passwordError ? (
              <p className="text-sm text-destructive" role="alert">
                {t("passwordError")}
              </p>
            ) : null}
          </div>
          <Button type="submit" variant="default" size="lg" className="w-full">
            {t("adminLogin")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

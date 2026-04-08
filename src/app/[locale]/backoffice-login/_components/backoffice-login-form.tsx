"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";
import { MOCK_USERS, useSession } from "@/lib/mock-session";

export function BackofficeLoginForm() {
  const t = useTranslations("auth");
  const { login } = useSession();
  const router = useRouter();

  function handleLogin() {
    const admin = MOCK_USERS.find((u) => u.role === "admin");
    if (!admin) return;
    login(admin);
    router.push(ROUTES.crmDashboard);
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleLogin}
        >
          {t("adminLogin")}
        </Button>
      </CardContent>
    </Card>
  );
}

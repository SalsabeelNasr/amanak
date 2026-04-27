import { crm } from "@/lib/crm/client";
import { getServerCrmCtx } from "@/lib/crm/ctx";
import { CrmToday } from "./_components/crm-today";
import { MOCK_USERS } from "@/lib/mock-users";

export default async function CrmDashboardPage() {
  const digest = await crm.digest.today(getServerCrmCtx());
  // In a real app, this would come from the auth session.
  // For the mock, we'll default to the first admin/CS user.
  const currentUserId = MOCK_USERS.find(u => u.role === "admin")?.id || "admin_1";

  return <CrmToday digest={digest} currentUserId={currentUserId} />;
}

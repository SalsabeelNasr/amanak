import { getCrmTodayDigest } from "@/lib/api/leads";
import { CrmToday } from "./_components/crm-today";
import { MOCK_USERS } from "@/lib/mock-users";

export default async function CrmDashboardPage() {
  const digest = await getCrmTodayDigest();
  // In a real app, this would come from the auth session.
  // For the mock, we'll default to the first admin/CS user.
  const currentUserId = MOCK_USERS.find(u => u.role === "admin")?.id || "admin_1";

  return <CrmToday digest={digest} currentUserId={currentUserId} />;
}

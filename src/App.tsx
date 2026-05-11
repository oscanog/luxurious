import { Authenticated, Unauthenticated } from "convex/react";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import { LoginPage } from "@/components/auth/LoginPage";
import { AdminLayout, type NavItem } from "@/components/dashboard/AdminLayout";
import { OrgChartPage } from "@/components/org-chart/OrgChartPage";
import { MembersPage } from "@/components/members/MembersPage";
import { InvitationsPage } from "@/components/invitations/InvitationsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { LearnToTradePage } from "@/components/dashboard/LearnToTradePage";
import { TradingAcademy } from "@/components/dashboard/TradingAcademy";
import { AdminPortal } from "@/components/dashboard/AdminPortal";
import { AcademyManager } from "@/components/dashboard/AcademyManager";
import { UserManager } from "@/components/dashboard/UserManager";
import { TradeMonitor } from "@/components/dashboard/TradeMonitor";

function Dashboard() {
  const [page, setPage] = useState<NavItem>("org-chart");

  return (
    <AdminLayout active={page} onNavigate={setPage}>
      {page === "org-chart" && <OrgChartPage />}
      {page === "members" && <UserManager />}
      {page === "invitations" && <InvitationsPage />}
      {page === "settings" && <SettingsPage />}
      {page === "learn-to-trade" && <LearnToTradePage />}
      {page === "academy" && <TradingAcademy />}
      {page === "admin-portal" && <AdminPortal onNavigate={setPage} />}
      {page === "academy-manager" && <AcademyManager />}
      {page === "trade-monitor" && <TradeMonitor />}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Authenticated>
        <Dashboard />
      </Authenticated>
      <Unauthenticated>
        <LoginPage />
      </Unauthenticated>
    </>
  );
}

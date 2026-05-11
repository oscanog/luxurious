import { Authenticated, Unauthenticated } from "convex/react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { OrgChartPage } from "@/pages/dashboard/OrgChartPage";
import { MembersPage } from "@/pages/dashboard/MembersPage";
import { InvitationsPage } from "@/pages/dashboard/InvitationsPage";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { LearnToTradePage } from "@/pages/dashboard/LearnToTradePage";
import { AcademyPage } from "@/pages/dashboard/AcademyPage";
import { AdminPortalPage } from "@/pages/admin/AdminPortalPage";
import { AcademyManagerPage } from "@/pages/admin/AcademyManagerPage";
import { TradeMonitorPage } from "@/pages/admin/TradeMonitorPage";

function AuthenticatedApp() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/org-chart" replace />} />
        <Route path="/org-chart" element={<OrgChartPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/invitations" element={<InvitationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/learn-to-trade" element={<LearnToTradePage />} />
        <Route path="/academy" element={<AcademyPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminPortalPage />} />
        <Route path="/admin/academy" element={<AcademyManagerPage />} />
        <Route path="/admin/trades" element={<TradeMonitorPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
      <Unauthenticated>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Unauthenticated>
    </BrowserRouter>
  );
}

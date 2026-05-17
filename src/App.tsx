import { useEffect, useRef, useState } from "react";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LoginPage } from "@/pages/LoginPage";
import { AdminPortalPage } from "@/pages/admin/AdminPortalPage";
import { ApkManagementPage } from "@/pages/admin/ApkManagementPage";
import { AcademyManagerPage } from "@/pages/admin/AcademyManagerPage";
import { TradeMonitorPage } from "@/pages/admin/TradeMonitorPage";
import { UserManagerPage } from "@/pages/admin/UserManagerPage";
import { PresentationStudioPage } from "@/pages/admin/PresentationStudioPage";
import { AcademyPage } from "@/pages/dashboard/AcademyPage";
import { AccountsPage } from "@/pages/dashboard/AccountsPage";
import { ActivityFeedPage } from "@/pages/dashboard/ActivityFeedPage";
import { BudgetsPage } from "@/pages/dashboard/BudgetsPage";
import { CalendarPage } from "@/pages/dashboard/CalendarPage";
import { CashflowPage } from "@/pages/dashboard/CashflowPage";
import { CurrencyPage } from "@/pages/dashboard/CurrencyPage";
import { DashboardHomePage } from "@/pages/dashboard/DashboardHomePage";
import { DebtTrackerPage } from "@/pages/dashboard/DebtTrackerPage";
import { ExpenseEntryPage } from "@/pages/dashboard/ExpenseEntryPage";
import { HistoryPage } from "@/pages/dashboard/HistoryPage";
import { IncomeEntryPage } from "@/pages/dashboard/IncomeEntryPage";
import { InstallmentsPage } from "@/pages/dashboard/InstallmentsPage";
import { LearnToTradePage } from "@/pages/dashboard/LearnToTradePage";
import { MembersPage } from "@/pages/dashboard/MembersPage";
import { OrgChartPage } from "@/pages/dashboard/OrgChartPage";
import { ProfilePage } from "@/pages/dashboard/ProfilePage";
import { PromotionsPage } from "@/pages/dashboard/PromotionsPage";
import { ReceiptScannerPage } from "@/pages/dashboard/ReceiptScannerPage";
import { ShoppingListPage } from "@/pages/dashboard/ShoppingListPage";
import { SocialAuthorPage } from "@/pages/dashboard/SocialAuthorPage";
import { SocialComposerPage } from "@/pages/dashboard/SocialComposerPage";
import { SocialFeedPage } from "@/pages/dashboard/SocialFeedPage";
import { SocialPostDetailPage } from "@/pages/dashboard/SocialPostDetailPage";
import { StatisticsPage } from "@/pages/dashboard/StatisticsPage";
import { TradingSignalsPage } from "@/pages/dashboard/TradingSignalsPage";
import { ApkDownloadPage } from "@/pages/ApkDownloadPage";
import {
  ThemeMode,
  applyThemeMode,
  getInitialThemeMode,
  persistThemeMode,
} from "@/lib/theme";

function LaunchScreen() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] border border-[hsl(var(--border))] bg-[linear-gradient(135deg,hsl(43_96%_48%),hsl(221_83%_53%))] text-3xl font-black text-white shadow-[0_24px_60px_-36px_hsl(221_83%_53%_/_0.55)]">
          L
        </div>
        <h1 className="mt-6 text-2xl font-black tracking-tight text-[hsl(var(--foreground))]">
          Preparing desktop workspace
        </h1>
        <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
          Syncing mobile-backed profile, notifications, and dashboard state.
        </p>
      </div>
    </div>
  );
}

function AuthenticatedApp({
  themeMode,
  onToggleTheme,
}: {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}) {
  const mobileStatus = useQuery(api.mobile.status);
  const bootstrap = useMutation(api.mobile.bootstrap);
  const bootstrapInFlight = useRef(false);

  useEffect(() => {
    if (mobileStatus?.ready !== false || bootstrapInFlight.current) {
      return;
    }

    bootstrapInFlight.current = true;
    void bootstrap({}).finally(() => {
      bootstrapInFlight.current = false;
    });
  }, [bootstrap, mobileStatus?.ready]);

  if (mobileStatus === undefined || mobileStatus.ready === false) {
    return <LaunchScreen />;
  }

  return (
    <AdminLayout themeMode={themeMode} onToggleTheme={onToggleTheme}>
      <Routes>
        <Route path="/" element={<DashboardHomePage />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/org-chart" element={<OrgChartPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/invitations" element={<Navigate to="/members" replace />} />
        <Route path="/social-feed" element={<SocialFeedPage />} />
        <Route path="/social-feed/new" element={<SocialComposerPage />} />
        <Route path="/social-feed/post/:postId" element={<SocialPostDetailPage />} />
        <Route path="/social-feed/user/:userId" element={<SocialAuthorPage />} />
        <Route path="/activity-feed" element={<ActivityFeedPage />} />
        <Route path="/trading-signals" element={<TradingSignalsPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/cashflow" element={<CashflowPage />} />
        <Route path="/currency" element={<CurrencyPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/debt-tracker" element={<DebtTrackerPage />} />
        <Route path="/installments" element={<InstallmentsPage />} />
        <Route path="/income" element={<IncomeEntryPage />} />
        <Route path="/expense" element={<ExpenseEntryPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/receipt-scanner" element={<ReceiptScannerPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/shopping-list" element={<ShoppingListPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<Navigate to="/profile" replace />} />
        <Route path="/learn-to-trade" element={<LearnToTradePage />} />
        <Route path="/academy" element={<AcademyPage />} />
        <Route path="/admin" element={<AdminPortalPage />} />
        <Route path="/admin/users" element={<UserManagerPage />} />
        <Route path="/admin/academy" element={<AcademyManagerPage />} />
        <Route path="/admin/trades" element={<TradeMonitorPage />} />
        <Route path="/admin/apk-management" element={<ApkManagementPage />} />
        <Route path="/admin/presentations" element={<PresentationStudioPage />} />
        <Route path="/admin/presentations/:id/edit" element={<PresentationStudioPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialThemeMode());

  useEffect(() => {
    applyThemeMode(themeMode);
    persistThemeMode(themeMode);
  }, [themeMode]);

  function toggleTheme() {
    setThemeMode((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Authenticated>
        <AuthenticatedApp themeMode={themeMode} onToggleTheme={toggleTheme} />
      </Authenticated>
      <Unauthenticated>
        <Routes>
          <Route path="/" element={<LoginPage themeMode={themeMode} onToggleTheme={toggleTheme} />} />
          <Route path="/download" element={<ApkDownloadPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Unauthenticated>
    </BrowserRouter>
  );
}

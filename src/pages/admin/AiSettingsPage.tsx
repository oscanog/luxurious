import { FormEvent, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Bot, RotateCcw, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../../convex/_generated/api";
import {
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
} from "@/components/dashboard/FinancePageHelpers";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { cn } from "@/lib/utils";

type ModelName = "deepseek-v4-flash" | "deepseek-v4-pro";
type AdminAiSettings = {
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  baseUrl: string;
  defaultModel: ModelName;
  temperature: number;
  maxOutputTokens: number;
  dailyUserMessageLimit: number;
  monthlyUserTokenLimit: number;
  enabledScopes: string[];
  enabledSkills: string[];
  isEnabled: boolean;
  updatedAt: number | null;
  apiKeyRotatedAt: number | null;
};
type AuditEvent = {
  _id: string;
  action: string;
  createdAt: number;
};

const SCOPE_OPTIONS = ["network", "finance", "academy", "support", "admin"] as const;
const SKILL_OPTIONS = ["general_chat", "workspace_help", "semantic_lookup", "admin_guidance"] as const;

export function AiSettingsPage() {
  const settings = useQuery(api.aiSettings.getAdminSettings);
  const auditEvents = useQuery(api.aiSettings.listAuditEvents, { limit: 10 });

  if (settings === undefined) return null;

  return (
    <AiSettingsContent
      key={`${settings.updatedAt ?? 0}-${settings.apiKeyRotatedAt ?? 0}`}
      settings={settings}
      auditEvents={auditEvents ?? []}
    />
  );
}

function AiSettingsContent({
  settings,
  auditEvents,
}: {
  settings: AdminAiSettings;
  auditEvents: AuditEvent[];
}) {
  const updateSettings = useMutation(api.aiSettings.updateSettings);
  const saveDeepSeekKey = useAction(api.aiSecrets.saveDeepSeekKey);

  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState<ModelName>(settings.defaultModel);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [maxOutputTokens, setMaxOutputTokens] = useState(settings.maxOutputTokens);
  const [dailyUserMessageLimit, setDailyUserMessageLimit] = useState(settings.dailyUserMessageLimit);
  const [monthlyUserTokenLimit, setMonthlyUserTokenLimit] = useState(settings.monthlyUserTokenLimit);
  const [enabledScopes, setEnabledScopes] = useState<string[]>(settings.enabledScopes);
  const [enabledSkills, setEnabledSkills] = useState<string[]>(settings.enabledSkills);
  const [isEnabled, setIsEnabled] = useState(settings.isEnabled);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  function toggleValue(value: string, values: string[], setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  async function handleSaveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingConfig(true);
    try {
      await updateSettings({
        defaultModel,
        temperature,
        maxOutputTokens,
        dailyUserMessageLimit,
        monthlyUserTokenLimit,
        enabledScopes,
        enabledSkills,
        isEnabled,
      });
      toast.success("AI settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSavingConfig(false);
    }
  }

  async function handleSaveKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingKey(true);
    try {
      await saveDeepSeekKey({ apiKey });
      setApiKey("");
      toast.success("DeepSeek key rotated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Key rotation failed");
    } finally {
      setIsSavingKey(false);
    }
  }

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="AI Control"
        title="AI Agent Settings"
        description="Manage DeepSeek V4 models, encrypted key rotation, assistant limits, skills, and pgvector retrieval scope."
        icon={Bot}
        badges={[
          { label: settings.isEnabled ? "Enabled" : "Disabled", tone: settings.isEnabled ? "success" : "danger" },
          { label: settings.defaultModel, tone: "primary" },
        ]}
        metrics={[
          { label: "Provider", value: "DeepSeek", tone: "primary" },
          { label: "Key", value: settings.hasApiKey ? settings.apiKeyPreview : "Missing", tone: settings.hasApiKey ? "success" : "warning" },
          { label: "Daily Limit", value: settings.dailyUserMessageLimit, tone: "neutral" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <form onSubmit={(event) => void handleSaveConfig(event)} className="space-y-6">
          <SurfaceCard className="p-5 sm:p-6">
            <DashboardSectionTitle
              eyebrow="Runtime"
              title="Provider and model"
              description="DeepSeek V4 stays server-side. React never sees provider keys."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Default Model
                </span>
                <select
                  value={defaultModel}
                  onChange={(event) => setDefaultModel(event.target.value as ModelName)}
                  className="h-12 w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm font-bold text-[hsl(var(--foreground))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.35)]"
                >
                  <option value="deepseek-v4-flash">deepseek-v4-flash</option>
                  <option value="deepseek-v4-pro">deepseek-v4-pro</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Temperature
                </span>
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                  className="h-12 w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm font-bold text-[hsl(var(--foreground))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.35)]"
                />
              </label>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <DashboardSectionTitle
              eyebrow="Limits"
              title="Usage limits"
              description="Hard limits block requests before DeepSeek calls."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <NumberField label="Max Output Tokens" value={maxOutputTokens} onChange={setMaxOutputTokens} />
              <NumberField label="Daily Messages" value={dailyUserMessageLimit} onChange={setDailyUserMessageLimit} />
              <NumberField label="Monthly Tokens" value={monthlyUserTokenLimit} onChange={setMonthlyUserTokenLimit} />
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <DashboardSectionTitle
              eyebrow="Scope"
              title="Skills and retrieval scope"
              description="Controls what the assistant may use when pgvector retrieval is enabled."
            />
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <ToggleGroup
                title="Scopes"
                values={SCOPE_OPTIONS}
                selected={enabledScopes}
                onToggle={(value) => toggleValue(value, enabledScopes, setEnabledScopes)}
              />
              <ToggleGroup
                title="Skills"
                values={SKILL_OPTIONS}
                selected={enabledSkills}
                onToggle={(value) => toggleValue(value, enabledSkills, setEnabledSkills)}
              />
            </div>
          </SurfaceCard>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm font-black text-[hsl(var(--foreground))]">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(event) => setIsEnabled(event.target.checked)}
                className="h-5 w-5 accent-[hsl(var(--primary))]"
              />
              AI assistant enabled
            </label>
            <button
              type="submit"
              disabled={isSavingConfig}
              className="rounded-2xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-black text-white shadow-[0_18px_34px_-24px_hsl(var(--primary))] disabled:opacity-60"
            >
              {isSavingConfig ? "Saving..." : "Save AI Settings"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <SurfaceCard className="p-5 sm:p-6">
            <DashboardSectionTitle
              eyebrow="Secret"
              title="DeepSeek key rotation"
              description="Key encrypts on server with AI_SETTINGS_MASTER_KEY."
            />
            <form onSubmit={(event) => void handleSaveKey(event)} className="mt-5 space-y-4">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  New API Key
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="sk-..."
                  className="h-12 w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm font-bold text-[hsl(var(--foreground))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.35)]"
                />
              </label>
              <button
                type="submit"
                disabled={!apiKey.trim() || isSavingKey}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--foreground))] px-5 py-3 text-sm font-black text-[hsl(var(--background))] disabled:opacity-60"
              >
                <RotateCcw size={16} />
                {isSavingKey ? "Rotating..." : "Rotate Key"}
              </button>
            </form>
          </SurfaceCard>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <DashboardMetricCard
              label="Base URL"
              value={settings.baseUrl}
              hint="Server action calls this endpoint only."
            />
            <DashboardMetricCard
              label="Security"
              value="Encrypted"
              hint="Plaintext key never returns through Convex queries."
            />
          </div>

          <SurfaceCard className="p-5 sm:p-6">
            <DashboardSectionTitle eyebrow="Audit" title="Recent changes" />
            <div className="mt-4 space-y-3">
              {(auditEvents ?? []).length === 0 ? (
                <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                  No AI settings changes yet.
                </p>
              ) : (
                (auditEvents ?? []).map((event) => (
                  <div
                    key={event._id}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.7)] p-3"
                  >
                    <p className="text-sm font-black text-[hsl(var(--foreground))]">{event.action}</p>
                    <p className="mt-1 text-[11px] font-bold text-[hsl(var(--muted-foreground))]">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </DashboardPageShell>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm font-bold text-[hsl(var(--foreground))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.35)]"
      />
    </label>
  );
}

function ToggleGroup({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string;
  values: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        <SlidersHorizontal size={14} />
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={cn(
                "rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition",
                active
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]",
              )}
            >
              {value.split("_").join(" ")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

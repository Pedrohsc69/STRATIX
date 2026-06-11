import { useEffect, useState, type PropsWithChildren } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Target,
  Users,
} from "lucide-react";
import { clearSession } from "../../store/app-store";
import { canAccess } from "./dashboard.permissions";
import type { DashboardContext, DashboardPermission, DashboardRole } from "./dashboard.types";
import { useTheme } from "../../core/theme/theme-context";
import { StratixLogo } from "../../shared/components/brand/StratixLogo";


type DashboardLayoutProps = PropsWithChildren<{
  context: DashboardContext;
  permissions: DashboardPermission[];
  role: DashboardRole;
  pageTitle?: string;
  pageDescription?: string;
  pageEyebrow?: string;
}>;

type MenuItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  requiredPermissions?: DashboardPermission[];
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  {
    label: "Departamentos",
    path: "/departaments",
    icon: Building2,
    requiredPermissions: [
      "departments:manage",
      "departments:view:department",
      "departments:view:department:readonly",
    ],
  },
  {
    label: "Ciclos",
    path: "/dashboard-cycles",
    icon: Target,
    requiredPermissions: ["cycles:manage", "cycles:manage:department", "cycles:view:department"],
  },
  {
    label: "Objetivos",
    path: "/objetivos",
    icon: FileText,
    requiredPermissions: ["objectives:manage", "objectives:manage:department", "objectives:view:department"],
  },
  {
    label: "OKRs",
    path: "/okrs",
    icon: CheckCircle2,
    requiredPermissions: ["okrs:manage", "okrs:manage:department", "okrs:view:own"],
  },
  {
    label: "Relatórios",
    path: "/reports",
    icon: FileText,
    requiredPermissions: ["reports:export", "reports:export:department"],
  },
  {
    label: "Funcionários",
    path: "/employees",
    icon: Users,
    requiredPermissions: ["users:manage", "users:view:department"],
  },
  {
    label: "Configurações",
    path: "/settings",
    icon: Settings,
    requiredPermissions: ["settings:view:self", "settings:manage:company"],
  },
];

function getInitials(value?: string | null) {
  if (!value?.trim()) {
    return "--";
  }

  const [firstName] = value.trim().split(/\s+/);
  return firstName.slice(0, 2).toUpperCase();
}

export function DashboardLayout({
  context,
  permissions,
  role,
  pageTitle,
  pageDescription,
  pageEyebrow,
  children,
}: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  const availableMenuItems = menuItems.filter(
    (item) =>
      !item.requiredPermissions ||
      item.requiredPermissions.some((permission) => canAccess(permissions, permission)),
  );

  const resolvedPageTitle =
    pageTitle ??
    role === "DIRECTOR"
      ? "Dashboard Executivo"
      : role === "MANAGER"
      ? "Dashboard Departamental"
      : "Minha Visão Estratégica";

  const resolvedPageDescription =
    pageDescription ??
    (role === "DIRECTOR"
      ? "Visão consolidada da empresa com foco em desempenho e risco."
      : role === "MANAGER"
      ? "Visão operacional do seu departamento com gestão de metas."
      : "Visão do seu departamento e dos OKRs sob sua responsabilidade.");

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const nextThemeLabel = resolvedTheme === "dark" ? "claro" : "escuro";

  return (
    <div
      className={`${resolvedTheme === "dark" ? "dark" : ""} h-screen overflow-hidden bg-background text-foreground lg:flex`}
    >
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#0F172A]/45 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] flex-col overflow-hidden border-r border-gray-200 bg-white p-5 text-foreground transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 lg:relative lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:p-6 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link to="/dashboard" className="mb-10 border-b border-gray-200 pb-6 dark:border-slate-800">
          <StratixLogo variant="auto" className="pl-2 sm:pl-4" imgClassName="h-10 w-auto sm:h-11" />
        </Link>

        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {availableMenuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  active
                    ? "bg-[#0F2A44] text-white dark:bg-[#1E4E79]"
                    : "text-[#4B5563] hover:bg-[#F8FAFC] dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-200 pt-6 dark:border-slate-800">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280] dark:text-slate-400">
                Tema
              </p>
              <p className="truncate text-sm text-[#1F2937] dark:text-slate-100">
                Alternar para {nextThemeLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#4B5563] transition-colors hover:bg-[#F8FAFC] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label={`Ativar tema ${nextThemeLabel}`}
              title={`Ativar tema ${nextThemeLabel}`}
            >
              {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Link to="/profile" className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1E4E79] text-white dark:bg-cyan-600 dark:text-slate-950">
                {getInitials(context.user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#1F2937] dark:text-slate-100">{context.user.name}</p>
                <p className="text-xs text-[#6B7280] dark:text-slate-400">{context.user.role}</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-[#6B7280] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F2A44] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
              aria-label="Sair da conta"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-[#4B5563] transition-colors hover:bg-[#F8FAFC] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <Link to="/dashboard" className="min-w-0">
                  <StratixLogo variant="auto" imgClassName="h-8 w-auto max-w-[160px]" />
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-[#4B5563] transition-colors hover:bg-[#F8FAFC] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label={`Ativar tema ${nextThemeLabel}`}
                    title={`Ativar tema ${nextThemeLabel}`}
                  >
                    {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-[#6B7280] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F2A44] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
                    aria-label="Sair da conta"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <p className="mb-2 text-sm uppercase tracking-[0.24em] text-[#6B7280] dark:text-slate-400">
                {pageEyebrow ?? context.company?.businessArea ?? "STRATIX"}
              </p>
              <h1 className="text-2xl font-semibold text-[#1F2937] dark:text-slate-50 sm:text-3xl">
                {resolvedPageTitle}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-[#6B7280] dark:text-slate-400 sm:text-base">
                {resolvedPageDescription}
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:gap-4 sm:px-5 sm:py-4">
              <div className="min-w-0 flex-1 text-left sm:text-right">
                <p className="text-sm font-medium text-[#1F2937] dark:text-slate-100">
                  {context.company?.name ?? "Empresa não configurada"}
                </p>
                <p className="truncate text-xs text-[#6B7280] dark:text-slate-400">
                  {context.department?.name ??
                    (role === "DIRECTOR" ? "Escopo corporativo" : "Sem departamento")}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2BB3A3] font-semibold text-white dark:bg-cyan-500 dark:text-slate-950">
                {getInitials(context.company?.name)}
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

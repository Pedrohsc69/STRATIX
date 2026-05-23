import type { PropsWithChildren } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { clearSession } from "../../store/app-store";
import { canAccess } from "./dashboard.permissions";
import type { DashboardContext, DashboardPermission, DashboardRole } from "./dashboard.types";
import logoMain from '@/shared/assets/logos/originals/logo-main.png';


type DashboardLayoutProps = PropsWithChildren<{
  context: DashboardContext;
  permissions: DashboardPermission[];
  role: DashboardRole;
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
    requiredPermissions: ["departments:manage"],
  },
  {
    label: "Ciclos",
    path: "/dashboard-cycles",
    icon: Target,
    requiredPermissions: ["cycles:manage", "cycles:view:department"],
  },
  {
    label: "Objetivos",
    path: "/objetivos",
    icon: FileText,
    requiredPermissions: ["objectives:manage", "objectives:manage:department"],
  },
  {
    label: "OKRs",
    path: "/okrs",
    icon: CheckCircle2,
    requiredPermissions: ["okrs:manage", "okrs:manage:department"],
  },
  {
    label: "Relatórios",
    path: "/reports",
    icon: FileText,
    requiredPermissions: ["reports:export"],
  },
  {
    label: "Funcionários",
    path: "/employees",
    icon: Users,
    requiredPermissions: ["users:manage"],
  },
  {
    label: "Configurações",
    path: "/settings",
    icon: Settings,
    requiredPermissions: ["settings:manage"],
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
  children,
}: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const availableMenuItems = menuItems.filter(
    (item) =>
      !item.requiredPermissions ||
      item.requiredPermissions.some((permission) => canAccess(permissions, permission)),
  );

  const pageTitle =
    role === "DIRECTOR"
      ? "Cockpit Executivo"
      : role === "MANAGER"
      ? "Cockpit Departamental"
      : "Minha Visão Estratégica";

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      <aside className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col">
        <Link to="/dashboard" className="border-b border-gray-200 pb-6  mb-10">
          <img className="w-48 pl-8" src={logoMain} alt="STRATIX" />
        </Link>

        <nav className="space-y-2">
          {availableMenuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  active
                    ? "bg-[#0F2A44] text-white"
                    : "text-[#4B5563] hover:bg-[#F8FAFC]"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between gap-3">
            <Link to="/profile" className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#1E4E79] text-white flex items-center justify-center font-semibold">
                {getInitials(context.user.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1F2937] truncate">{context.user.name}</p>
                <p className="text-xs text-[#6B7280]">{context.user.role}</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 text-[#6B7280] hover:text-[#0F2A44] hover:bg-[#F8FAFC] transition-colors"
              aria-label="Sair da conta"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#6B7280] mb-2">
                {context.company?.businessArea ?? "STRATIX"}
              </p>
              <h1 className="text-3xl font-semibold text-[#1F2937]">{pageTitle}</h1>
              <p className="text-[#6B7280] mt-2">
                {role === "DIRECTOR"
                  ? "Visão consolidada da empresa com foco em desempenho e risco."
                  : role === "MANAGER"
                  ? "Visão operacional do seu departamento com gestão de metas."
                  : "Visão enxuta do seu departamento e dos OKRs sob sua responsabilidade."}
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-5 py-4">
              <div className="text-right">
                <p className="text-sm font-medium text-[#1F2937]">
                  {context.company?.name ?? "Empresa não configurada"}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {context.department?.name ??
                    (role === "DIRECTOR" ? "Escopo corporativo" : "Sem departamento")}
                </p>
              </div>
              <div className="w-11 h-11 rounded-full bg-[#2BB3A3] text-white flex items-center justify-center font-semibold">
                {getInitials(context.company?.name)}
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

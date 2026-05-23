import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Target,
  FileText,
  Users,
  Settings,
  Search,
  Filter,
  Bell,
  Shield,
  Workflow,
  Globe,
  Save,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { getSession } from "../../../store/app-store";
import stratix_logo_princpial from "../components/Principal_normal.png";

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  category: "organization" | "notifications" | "security" | "integrations";
  status: "configured" | "attention" | "review";
  owner: string;
  lastUpdated: string;
}

interface Integration {
  id: string;
  name: string;
  status: "active" | "inactive";
  sync: string;
}

const mockSections: SettingsSection[] = [
  {
    id: "1",
    title: "Dados Organizacionais",
    description: "Nome da empresa, unidades, fuso horário e parâmetros operacionais.",
    category: "organization",
    status: "configured",
    owner: "Diretoria",
    lastUpdated: "2026-05-18",
  },
  {
    id: "2",
    title: "Política de Notificações",
    description: "Alertas de ciclos, lembretes de OKRs e frequência de comunicações.",
    category: "notifications",
    status: "review",
    owner: "RH",
    lastUpdated: "2026-05-20",
  },
  {
    id: "3",
    title: "Permissões e Acessos",
    description: "Perfis, regras de aprovação e autenticação para gestores e colaboradores.",
    category: "security",
    status: "attention",
    owner: "TI",
    lastUpdated: "2026-05-21",
  },
  {
    id: "4",
    title: "Integrações Corporativas",
    description: "Sincronização com ERP, SSO, relatórios externos e diretórios internos.",
    category: "integrations",
    status: "configured",
    owner: "Operações",
    lastUpdated: "2026-05-19",
  },
];

const mockIntegrations: Integration[] = [
  { id: "1", name: "Microsoft Entra ID", status: "active", sync: "Sincronizado há 5 min" },
  { id: "2", name: "Power BI", status: "active", sync: "Sincronizado há 18 min" },
  { id: "3", name: "ERP Financeiro", status: "active", sync: "Sincronizado hoje, 09:30" },
  { id: "4", name: "Slack", status: "inactive", sync: "Desconectado" },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: false, path: "/dashboard-director" },
  { icon: Building2, label: "Departamentos", active: false, path: "/departaments" },
  { icon: Target, label: "Ciclos Estratégicos", active: false, path: "/dashboard-cycles" },
  { icon: FileText, label: "Relatórios", active: false, path: "/reports" },
  { icon: Users, label: "Funcionários", active: false, path: "/employees" },
  { icon: Settings, label: "Configurações", active: true, path: "/settings" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const session = getSession();
  const [sidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(true);

  const filteredSections = mockSections.filter((section) => {
    const matchesSearch =
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || section.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const activeIntegrations = mockIntegrations.filter(
    (integration) => integration.status === "active"
  ).length;
  const sectionsConfigured = mockSections.filter(
    (section) => section.status === "configured"
  ).length;
  const sectionsNeedingAttention = mockSections.filter(
    (section) => section.status === "attention"
  ).length;

  const categories = Array.from(new Set(mockSections.map((section) => section.category)));

  const getCategoryLabel = (category: SettingsSection["category"]) => {
    const labels = {
      organization: "Organização",
      notifications: "Notificações",
      security: "Segurança",
      integrations: "Integrações",
    };

    return labels[category];
  };

  const getCategoryIcon = (category: SettingsSection["category"]) => {
    const icons = {
      organization: Building2,
      notifications: Bell,
      security: Shield,
      integrations: Workflow,
    };

    return icons[category];
  };

  const getStatusConfig = (status: SettingsSection["status"]) => {
    const configs = {
      configured: {
        label: "Configurado",
        color: "bg-[#D1FAE5] text-[#065F46] border-[#10B981]",
        icon: CheckCircle2,
      },
      attention: {
        label: "Requer Atenção",
        color: "bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]",
        icon: AlertCircle,
      },
      review: {
        label: "Em Revisão",
        color: "bg-[#FEF3C7] text-[#92400E] border-[#D97706]",
        icon: Clock,
      },
    };

    return configs[status];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSaveSettings = () => {
    alert("Configurações salvas com sucesso.");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 z-40 transition-all`}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-32">
              <img src={stratix_logo_princpial} alt="stratix_logo_horizontal" />
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item, index) => (
            <motion.button
              key={index}
              whileHover={{ x: 4 }}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.active
                  ? "bg-[#1E3A5F] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <Link to="/profile">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold">
                PE
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{session?.user.name}</p>
                  <p className="text-xs text-gray-500">{session?.user.email}</p>
                </div>
              )}
            </div>
          </Link>
        </div>
      </motion.aside>

      <main className="ml-64 p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
            <button
              onClick={() => navigate("/dashboard-director")}
              className="hover:text-[#1E3A5F] transition-colors"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-[#1F2937] font-medium">Configurações</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-[#1F2937] mb-2">Configurações</h1>
              <p className="text-[#6B7280]">
                Centralize preferências operacionais, acessos e integrações da plataforma
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all shadow-sm"
            >
              <Save className="w-5 h-5" />
              Salvar alterações
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <Settings className="w-6 h-6 text-[#1E3A5F]" />
              </div>
              <span className="text-xs font-medium text-[#6B7280]">Módulos</span>
            </div>
            <p className="text-3xl font-semibold text-[#1F2937] mb-1">{mockSections.length}</p>
            <p className="text-sm text-[#6B7280]">Áreas disponíveis para configuração</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#059669]" />
              </div>
              <span className="text-xs font-medium text-[#6B7280]">Status</span>
            </div>
            <p className="text-3xl font-semibold text-[#1F2937] mb-1">{sectionsConfigured}</p>
            <p className="text-sm text-[#6B7280]">Seções totalmente configuradas</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#D97706]" />
              </div>
              <span className="text-xs font-medium text-[#6B7280]">Segurança</span>
            </div>
            <p className="text-3xl font-semibold text-[#1F2937] mb-1">{sectionsNeedingAttention}</p>
            <p className="text-sm text-[#6B7280]">Políticas requerendo atenção</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[#4F46E5]" />
              </div>
              <span className="text-xs font-medium text-[#6B7280]">Integrações</span>
            </div>
            <p className="text-3xl font-semibold text-[#1F2937] mb-1">{activeIntegrations}</p>
            <p className="text-sm text-[#6B7280]">Conexões corporativas ativas</p>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="Buscar configuração..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] appearance-none min-w-[190px]"
                    >
                      <option value="all">Todas as categorias</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {getCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredSections.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-[#1E3A5F]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1F2937] mb-2">
                    Nenhuma configuração encontrada
                  </h3>
                  <p className="text-[#6B7280] max-w-md mx-auto">
                    Ajuste os filtros para localizar a configuração que deseja revisar.
                  </p>
                </div>
              ) : (
                filteredSections.map((section) => {
                  const statusConfig = getStatusConfig(section.status);
                  const CategoryIcon = getCategoryIcon(section.category);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={section.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                            <CategoryIcon className="w-6 h-6 text-[#1E3A5F]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-[#1F2937]">
                                {section.title}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${statusConfig.color}`}
                              >
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusConfig.label}
                              </span>
                            </div>
                            <p className="text-sm text-[#6B7280] leading-relaxed max-w-2xl">
                              {section.description}
                            </p>
                          </div>
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-[#374151] rounded-lg hover:bg-gray-50 transition-colors">
                          Configurar
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#9CA3AF] mb-1">
                            Categoria
                          </p>
                          <p className="text-sm font-medium text-[#1F2937]">
                            {getCategoryLabel(section.category)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#9CA3AF] mb-1">
                            Responsável
                          </p>
                          <p className="text-sm font-medium text-[#1F2937]">{section.owner}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#9CA3AF] mb-1">
                            Última atualização
                          </p>
                          <p className="text-sm font-medium text-[#1F2937]">
                            {formatDate(section.lastUpdated)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Preferências rápidas</h3>

              <div className="space-y-4">
                <button
                  onClick={() => setEmailNotifications((current) => !current)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1F2937]">Notificações por e-mail</p>
                    <p className="text-xs text-[#6B7280]">Alertas de ciclos e aprovações</p>
                  </div>
                  <span
                    className={`w-11 h-6 rounded-full transition-colors ${
                      emailNotifications ? "bg-[#1E3A5F]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${
                        emailNotifications ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </span>
                </button>

                <button
                  onClick={() => setAutoSave((current) => !current)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1F2937]">Auto salvamento</p>
                    <p className="text-xs text-[#6B7280]">Salvar alterações automaticamente</p>
                  </div>
                  <span
                    className={`w-11 h-6 rounded-full transition-colors ${
                      autoSave ? "bg-[#1E3A5F]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${
                        autoSave ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </span>
                </button>

                <button
                  onClick={() => setMfaRequired((current) => !current)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1F2937]">
                      MFA obrigatório para gestores
                    </p>
                    <p className="text-xs text-[#6B7280]">Reforço de segurança por perfil</p>
                  </div>
                  <span
                    className={`w-11 h-6 rounded-full transition-colors ${
                      mfaRequired ? "bg-[#1E3A5F]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${
                        mfaRequired ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1F2937]">Integrações</h3>
                <Globe className="w-5 h-5 text-[#6B7280]" />
              </div>

              <div className="space-y-3">
                {mockIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-gray-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1F2937]">{integration.name}</p>
                      <p className="text-xs text-[#6B7280]">{integration.sync}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        integration.status === "active"
                          ? "bg-[#D1FAE5] text-[#065F46]"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      {integration.status === "active" ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1F2937]">Segurança</h3>
                <KeyRound className="w-5 h-5 text-[#6B7280]" />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Sessão máxima</span>
                  <span className="font-medium text-[#1F2937]">12 horas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Rotação de senha</span>
                  <span className="font-medium text-[#1F2937]">A cada 90 dias</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Logs de auditoria</span>
                  <span className="font-medium text-[#1F2937]">Ativos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search,
  Plus,
  Filter,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  FileDown,
  Calendar,
  Users,
  LayoutDashboard,
  FileText,
  Building2,
  Settings,
} from "lucide-react";
import { motion } from "motion/react";
import { getSession } from "../../../store/app-store";
import logoMain from "@/shared/assets/logos/originals/logo-main.png";




interface StrategicCycle {
  id: string;
  name: string;
  department: string;
  manager: string;
  startDate: string;
  endDate: string;
  status: "completed" | "in_progress" | "delayed" | "planning";
  progress: number;
  objectives: number;
  okrs: number;
}

// Mock data
const mockCycles: StrategicCycle[] = [
  {
    id: "1",
    name: "Expansão Digital Q2",
    department: "Marketing",
    manager: "Ana Silva",
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    status: "in_progress",
    progress: 65,
    objectives: 5,
    okrs: 15,
  },
  {
    id: "2",
    name: "Otimização de Processos",
    department: "Operações",
    manager: "Carlos Santos",
    startDate: "2026-01-15",
    endDate: "2026-03-31",
    status: "completed",
    progress: 100,
    objectives: 3,
    okrs: 9,
  },
  {
    id: "3",
    name: "Modernização Tecnológica",
    department: "Tecnologia",
    manager: "João Santos",
    startDate: "2026-03-01",
    endDate: "2026-05-31",
    status: "delayed",
    progress: 42,
    objectives: 6,
    okrs: 18,
  },
  {
    id: "4",
    name: "Crescimento de Receita",
    department: "Vendas",
    manager: "Carlos Mendes",
    startDate: "2026-04-15",
    endDate: "2026-07-15",
    status: "in_progress",
    progress: 55,
    objectives: 4,
    okrs: 12,
  },
  {
    id: "5",
    name: "Retenção de Talentos",
    department: "Recursos Humanos",
    manager: "Maria Oliveira",
    startDate: "2026-02-01",
    endDate: "2026-04-30",
    status: "in_progress",
    progress: 78,
    objectives: 3,
    okrs: 8,
  },
  {
    id: "6",
    name: "Redução de Custos",
    department: "Financeiro",
    manager: "Pedro Costa",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    status: "completed",
    progress: 100,
    objectives: 4,
    okrs: 11,
  },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: false, path: "/dashboard" },
  { icon: Building2, label: "Departamentos", active: false, path: "/departaments" },
  { icon: Target, label: "Ciclos Estratégicos", active: true, path: "/dashboard-cycles" },
  { icon: FileText, label: "Relatórios", active: false, path: "/reports" },
  { icon: Users, label: "Funcionários", active: false, path: "/employees" },
  { icon: Settings, label: "Configurações", active: false, path: "/settings" }
];

export  function StrategicCyclesPage() {
  const navigate = useNavigate();
  const session = getSession();
  const [sidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [cycles] = useState<StrategicCycle[]>(mockCycles);

  // Filter cycles
  const filteredCycles = cycles.filter((cycle) => {
    const matchesSearch =
      cycle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cycle.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cycle.status === statusFilter;
    const matchesDepartment =
      departmentFilter === "all" || cycle.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Calculate KPIs
  const totalCycles = cycles.length;
  const completedCycles = cycles.filter((c) => c.status === "completed").length;
  const inProgressCycles = cycles.filter((c) => c.status === "in_progress").length;
  const delayedCycles = cycles.filter((c) => c.status === "delayed").length;
  const completionRate = totalCycles > 0 ? Math.round((completedCycles / totalCycles) * 100) : 0;

  // Recent cycles
  const recentCycles = [...cycles]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5);

  // Get unique departments
  const departments = Array.from(new Set(cycles.map((c) => c.department)));

  const getStatusConfig = (status: StrategicCycle["status"]) => {
    const configs = {
      completed: {
        label: "Concluído",
        color: "bg-[#D1FAE5] text-[#065F46] border-[#10B981]",
        icon: CheckCircle2,
      },
      in_progress: {
        label: "Em Andamento",
        color: "bg-[#DBEAFE] text-[#1E40AF] border-[#2563EB]",
        icon: Clock,
      },
      delayed: {
        label: "Atrasado",
        color: "bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]",
        icon: AlertCircle,
      },
      planning: {
        label: "Planejamento",
        color: "bg-[#FEF3C7] text-[#92400E] border-[#D97706]",
        icon: Target,
      },
    };
    return configs[status];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 z-40 transition-all`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-32">
                <img src={logoMain} alt="stratix_logo_horizontal" />
              </div>
            </div>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item, index) => (
            <motion.button
              key={index}
              whileHover={{ x: 4 }}
              onClick={() => item.path !== "#" && navigate(item.path)}
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

        {/* User Profile */}
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

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="hover:text-[#1E3A5F] transition-colors"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-[#1F2937] font-medium">Ciclos Estratégicos</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-[#1F2937] mb-2">
                Ciclos Estratégicos
              </h1>
              <p className="text-[#6B7280]">
                Acompanhe o desempenho e andamento dos ciclos da empresa
              </p>
            </div>
            <button
              onClick={() => navigate("/ciclos/novo")}
              className="flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Novo Ciclo Estratégico
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#6B7280]">Total de Ciclos</span>
              <Target className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <p className="text-3xl font-semibold text-[#1F2937]">{totalCycles}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#6B7280]">Concluídos</span>
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            </div>
            <p className="text-3xl font-semibold text-[#10B981]">{completedCycles}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#6B7280]">Em Andamento</span>
              <Clock className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-3xl font-semibold text-[#2563EB]">{inProgressCycles}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#6B7280]">Atrasados</span>
              <AlertCircle className="w-5 h-5 text-[#DC2626]" />
            </div>
            <p className="text-3xl font-semibold text-[#DC2626]">{delayedCycles}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#6B7280]">Taxa de Conclusão</span>
              <TrendingUp className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <p className="text-3xl font-semibold text-[#1F2937]">{completionRate}%</p>
            <div className="mt-3 w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="Buscar ciclo ou departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-[#6B7280]" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm"
                  >
                    <option value="all">Todos os status</option>
                    <option value="completed">Concluído</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="delayed">Atrasado</option>
                    <option value="planning">Planejamento</option>
                  </select>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm"
                  >
                    <option value="all">Todos os departamentos</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cycles Table */}
            {filteredCycles.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-[#1E3A5F]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1F2937] mb-2">
                  {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
                    ? "Nenhum ciclo encontrado"
                    : "Nenhum ciclo estratégico criado"}
                </h3>
                <p className="text-[#6B7280] mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
                    ? "Tente ajustar sua busca ou filtros"
                    : "Crie ciclos estratégicos para acompanhar metas organizacionais"}
                </p>
                {!searchTerm && statusFilter === "all" && departmentFilter === "all" && (
                  <button
                    onClick={() => navigate("/ciclos/novo")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Criar primeiro ciclo
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F5F7FA] border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Ciclo
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Departamento
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Gestor
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Período
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Progresso
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          OKRs
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredCycles.map((cycle) => {
                        const statusConfig = getStatusConfig(cycle.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <tr key={cycle.id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-[#1F2937]">{cycle.name}</div>
                              <div className="text-sm text-[#6B7280]">
                                {cycle.objectives} objetivos
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-[#1F2937]">{cycle.department}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#1E40AF] text-xs font-semibold">
                                  {cycle.manager
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <span className="text-sm text-[#1F2937]">{cycle.manager}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                              >
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      cycle.status === "completed"
                                        ? "bg-[#10B981]"
                                        : cycle.status === "delayed"
                                        ? "bg-[#DC2626]"
                                        : "bg-[#2563EB]"
                                    }`}
                                    style={{ width: `${cycle.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-[#1F2937] w-10">
                                  {cycle.progress}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-[#1F2937]">
                                {cycle.okrs}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button className="p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors text-[#6B7280] hover:text-[#1E3A5F]">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors text-[#6B7280] hover:text-[#1E3A5F]">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors text-[#6B7280] hover:text-[#1E3A5F]">
                                  <FileDown className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {filteredCycles.length > 0 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-[#6B7280]">
                  Exibindo {filteredCycles.length} de {cycles.length} ciclos estratégicos
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Recent Cycles */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#1E3A5F]" />
                Últimos Ciclos Criados
              </h3>
              <div className="space-y-4">
                {recentCycles.map((cycle) => {
                  const statusConfig = getStatusConfig(cycle.status);
                  return (
                    <div
                      key={cycle.id}
                      className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      <div className="font-medium text-sm text-[#1F2937] mb-1">
                        {cycle.name}
                      </div>
                      <div className="text-xs text-[#6B7280] mb-2">{cycle.department}</div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                        <span className="text-xs text-[#6B7280]">
                          {formatDate(cycle.startDate)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

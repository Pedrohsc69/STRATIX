import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search,
  FileText,
  Download,
  Filter,
  LayoutDashboard,
  Target,
  Users,
  Building2,
  Calendar,
  Clock,
  BarChart3,
  FileDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  PieChart,
  Settings,
} from "lucide-react";
import { getSession } from "../../../store/app-store";
import { motion } from "motion/react";


interface Report {
  id: string;
  name: string;
  type: "general" | "cycle" | "department" | "okr";
  generatedAt: string;
  generatedBy: string;
  format: "PDF" | "CSV";
  size: string;
}

// Mock data
const mockReports: Report[] = [
  {
    id: "1",
    name: "Relatório Geral Q2 2026",
    type: "general",
    generatedAt: "2026-05-08T14:30:00",
    generatedBy: "Diretor Silva",
    format: "PDF",
    size: "2.4 MB",
  },
  {
    id: "2",
    name: "Ciclo: Expansão Digital",
    type: "cycle",
    generatedAt: "2026-05-07T10:15:00",
    generatedBy: "Ana Silva",
    format: "CSV",
    size: "128 KB",
  },
  {
    id: "3",
    name: "Departamento: Marketing",
    type: "department",
    generatedAt: "2026-05-06T16:45:00",
    generatedBy: "Diretor Silva",
    format: "PDF",
    size: "1.8 MB",
  },
  {
    id: "4",
    name: "OKRs - Q1 2026",
    type: "okr",
    generatedAt: "2026-05-05T11:20:00",
    generatedBy: "Carlos Mendes",
    format: "CSV",
    size: "256 KB",
  },
  {
    id: "5",
    name: "Relatório Geral Q1 2026",
    type: "general",
    generatedAt: "2026-04-30T09:00:00",
    generatedBy: "Diretor Silva",
    format: "PDF",
    size: "2.1 MB",
  },
];

const mockStats = {
  totalReports: 42,
  lastExport: "2026-05-08",
  mostUsed: "Relatório Geral",
  delayedCycles: 3,
};

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: false, path: "/dashboard-director" },
  { icon: Building2, label: "Departamentos", active: false, path: "/departaments" },
  { icon: Target, label: "Ciclos Estratégicos", active: false, path: "/dashboard-cycles" },
  { icon: FileText, label: "Relatórios", active: true, path: "/reports" },
  { icon: Users, label: "Funcionários", active: false, path: "/employees" },
  { icon: Settings, label: "Configurações", active: false, path: "#" }
]

export function ReportsPage() {
  const navigate = useNavigate();
  const [sidebarOpen] = useState(true);
  const session = getSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [reports] = useState<Report[]>(mockReports);

  const filteredReports = reports.filter((report) =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getReportTypeLabel = (type: Report["type"]) => {
    const labels = {
      general: "Geral",
      cycle: "Ciclo",
      department: "Departamento",
      okr: "OKRs",
    };
    return labels[type];
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleGenerateReport = (type: string) => {
    alert(`Gerando relatório ${type}...`);
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
              <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#10B981] rounded" />
              </div>
              {sidebarOpen && (
                <span className="text-lg font-semibold text-[#1E3A5F] tracking-tight">STRATIX</span>
              )}
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
            <span className="text-[#1F2937] font-medium">Relatórios</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-[#1F2937] mb-2">
              Relatórios Estratégicos
            </h1>
            <p className="text-[#6B7280]">
              Gere relatórios organizacionais e acompanhe indicadores estratégicos
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Report Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Card 1 - General Report */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#1E3A5F]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-1">
                      Relatório Geral
                    </h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      Relatório consolidado contendo departamentos, ciclos estratégicos,
                      gestores responsáveis, objetivos e OKRs.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Departamentos</span>
                    <span className="font-medium text-[#1F2937]">6</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Ciclos ativos</span>
                    <span className="font-medium text-[#1F2937]">12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Última geração</span>
                    <span className="font-medium text-[#1F2937]">08/05/2026</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateReport("Geral - PDF")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all"
                  >
                    <FileDown className="w-4 h-4" />
                    Gerar PDF
                  </button>
                  <button
                    onClick={() => handleGenerateReport("Geral - CSV")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-[#1F2937] text-sm font-medium rounded-lg hover:bg-[#F5F7FA] transition-all"
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>
              </div>

              {/* Card 2 - Cycle Report */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#2563EB]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-1">
                      Relatório de Ciclo Estratégico
                    </h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      Relatório detalhado contendo objetivos, progresso dos OKRs e status final
                      do ciclo.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">
                      Selecione o ciclo
                    </label>
                    <select
                      value={selectedCycle}
                      onChange={(e) => setSelectedCycle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="1">Expansão Digital Q2</option>
                      <option value="2">Otimização de Processos</option>
                      <option value="3">Modernização Tecnológica</option>
                      <option value="4">Crescimento de Receita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">
                      Departamento (opcional)
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm">
                      <option value="">Todos</option>
                      <option value="marketing">Marketing</option>
                      <option value="vendas">Vendas</option>
                      <option value="tecnologia">Tecnologia</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateReport("Ciclo - PDF")}
                    disabled={!selectedCycle}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileDown className="w-4 h-4" />
                    Gerar PDF
                  </button>
                  <button
                    onClick={() => handleGenerateReport("Ciclo - CSV")}
                    disabled={!selectedCycle}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-[#1F2937] text-sm font-medium rounded-lg hover:bg-[#F5F7FA] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>
              </div>

              {/* Card 3 - Department Report */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#16A34A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-1">
                      Relatório por Departamento
                    </h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      Desempenho do departamento, ciclos vinculados, progresso médio e
                      quantidade de OKRs.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">
                      Selecione o departamento
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm"
                    >
                      <option value="all">Todos</option>
                      <option value="marketing">Marketing</option>
                      <option value="vendas">Vendas</option>
                      <option value="tecnologia">Tecnologia</option>
                      <option value="rh">Recursos Humanos</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="operacoes">Operações</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateReport("Departamento - PDF")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all"
                  >
                    <FileDown className="w-4 h-4" />
                    Gerar PDF
                  </button>
                  <button
                    onClick={() => handleGenerateReport("Departamento - CSV")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-[#1F2937] text-sm font-medium rounded-lg hover:bg-[#F5F7FA] transition-all"
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>
              </div>

              {/* Card 4 - OKR Performance Report */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-[#D97706]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-1">
                      Relatório de Desempenho de OKRs
                    </h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      OKRs concluídos, atrasados, em andamento, responsáveis e taxa de
                      conclusão.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Total de OKRs</span>
                    <span className="font-medium text-[#1F2937]">47</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Concluídos</span>
                    <span className="font-medium text-[#16A34A]">28</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Atrasados</span>
                    <span className="font-medium text-[#DC2626]">5</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateReport("OKRs - PDF")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all"
                  >
                    <FileDown className="w-4 h-4" />
                    Gerar PDF
                  </button>
                  <button
                    onClick={() => handleGenerateReport("OKRs - CSV")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-[#1F2937] text-sm font-medium rounded-lg hover:bg-[#F5F7FA] transition-all"
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="Buscar relatório..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-[#6B7280]" />
                  <select className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm">
                    <option value="all">Todos os tipos</option>
                    <option value="general">Geral</option>
                    <option value="cycle">Ciclo</option>
                    <option value="department">Departamento</option>
                    <option value="okr">OKRs</option>
                  </select>
                  <select className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm">
                    <option value="all">Último mês</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mês</option>
                    <option value="quarter">Último trimestre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recent Reports Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-[#1F2937] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#1E3A5F]" />
                  Relatórios Recentes
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F7FA] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                        Nome do Relatório
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                        Gerado em
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                        Formato
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#EFF6FF] flex items-center justify-center">
                              <FileText className="w-4 h-4 text-[#1E3A5F]" />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-[#1F2937]">
                                {report.name}
                              </div>
                              <div className="text-xs text-[#6B7280]">{report.size}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F7FA] text-[#1F2937]">
                            {getReportTypeLabel(report.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(report.generatedAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#1F2937]">{report.generatedBy}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                              report.format === "PDF"
                                ? "bg-[#FEE2E2] text-[#991B1B]"
                                : "bg-[#D1FAE5] text-[#065F46]"
                            }`}
                          >
                            {report.format}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors text-[#6B7280] hover:text-[#1E3A5F]">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors text-[#6B7280] hover:text-[#1E3A5F]">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar - Executive Summary */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#1E3A5F]" />
                Resumo Executivo
              </h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <div className="text-sm text-[#6B7280] mb-1">Total de relatórios</div>
                  <div className="text-2xl font-semibold text-[#1F2937]">
                    {mockStats.totalReports}
                  </div>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <div className="text-sm text-[#6B7280] mb-1">Última exportação</div>
                  <div className="text-sm font-medium text-[#1F2937]">
                    {new Date(mockStats.lastExport).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <div className="text-sm text-[#6B7280] mb-1">Mais utilizado</div>
                  <div className="text-sm font-medium text-[#1F2937]">
                    {mockStats.mostUsed}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Ciclos com atraso</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-semibold text-[#DC2626]">
                      {mockStats.delayedCycles}
                    </div>
                    <AlertCircle className="w-5 h-5 text-[#DC2626]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                Formatos Disponíveis
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#FEE2E2] flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[#DC2626]" />
                    </div>
                    <span className="text-sm font-medium text-[#1F2937]">PDF</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#D1FAE5] flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[#065F46]" />
                    </div>
                    <span className="text-sm font-medium text-[#1F2937]">CSV</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

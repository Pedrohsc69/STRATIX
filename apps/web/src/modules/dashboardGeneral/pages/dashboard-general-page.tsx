import { useState } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Building2,
  Target,
  FileText,
  Users,
  Settings,
  Search,
  Bell,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  Award,
  Activity,
  BarChart3
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Link, useNavigate } from "react-router-dom";
// import { motion } from "motion/react";
// import { Target, TrendingUp, Users } from "lucide-react";
import { clearSession, getSession } from "../../../store/app-store";

// Mock data
const departmentData = [
  {
    id: 1,
    name: "Marketing",
    concluidos: 12,
    emAndamento: 5,
    atrasados: 2
  },
  {
    id: 2,
    name: "RH",
    concluidos: 8,
    emAndamento: 3,
    atrasados: 1
  },
  {
    id: 3,
    name: "Financeiro",
    concluidos: 15,
    emAndamento: 7,
    atrasados: 0
  },
  {
    id: 4,
    name: "Tecnologia",
    concluidos: 18,
    emAndamento: 9,
    atrasados: 3
  },
  {
    id: 5,
    name: "Operações",
    concluidos: 10,
    emAndamento: 6,
    atrasados: 1
  }
];

const timelineData = [
  { id: 1, month: "Jan", ciclos: 8 },
  { id: 2, month: "Fev", ciclos: 12 },
  { id: 3, month: "Mar", ciclos: 15 },
  { id: 4, month: "Abr", ciclos: 18 },
  { id: 5, month: "Mai", ciclos: 22 },
  { id: 6, month: "Jun", ciclos: 28 }
];

const recentCycles = [
  {
    id: 1,
    nome: "Expansão Digital Q2",
    departamento: "Marketing",
    status: "em_andamento",
    prazo: "2026-05-15",
    responsavel: "Ana Silva"
  },
  {
    id: 2,
    nome: "Otimização de Processos",
    departamento: "Operações",
    status: "concluido",
    prazo: "2026-04-30",
    responsavel: "Carlos Santos"
  },
  {
    id: 3,
    nome: "Implementação ERP",
    departamento: "Tecnologia",
    status: "em_andamento",
    prazo: "2026-06-30",
    responsavel: "Marina Costa"
  },
  {
    id: 4,
    nome: "Auditoria Fiscal 2026",
    departamento: "Financeiro",
    status: "atrasado",
    prazo: "2026-04-20",
    responsavel: "Roberto Alves"
  },
  {
    id: 5,
    nome: "Programa de Capacitação",
    departamento: "RH",
    status: "em_andamento",
    prazo: "2026-05-30",
    responsavel: "Julia Mendes"
  }
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Building2, label: "Departamentos", active: false },
  { icon: Target, label: "Ciclos Estratégicos", active: false },
  { icon: FileText, label: "Relatórios", active: false },
  { icon: Users, label: "Funcionários", active: false },
  { icon: Settings, label: "Configurações", active: false }
];

export function DashboardGeneralPage() {
  const [sidebarOpen] = useState(true);
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  // Calculate KPIs
  const totalCiclos = departmentData.reduce((acc, dept) =>
    acc + dept.concluidos + dept.emAndamento + dept.atrasados, 0
  );
  const ciclosConcluidos = departmentData.reduce((acc, dept) => acc + dept.concluidos, 0);
  const ciclosAndamento = departmentData.reduce((acc, dept) => acc + dept.emAndamento, 0);
  const ciclosAtrasados = departmentData.reduce((acc, dept) => acc + dept.atrasados, 0);
  const percentualConclusao = Math.round((ciclosConcluidos / totalCiclos) * 100);

  // Rankings
  const rankingConcluidos = [...departmentData].sort((a, b) => b.concluidos - a.concluidos);
  const rankingAndamento = [...departmentData].sort((a, b) => b.emAndamento - a.emAndamento);
  const rankingAtrasados = [...departmentData].sort((a, b) => b.atrasados - a.atrasados);

  const getStatusBadge = (status: string) => {
    const styles = {
      concluido: "bg-green-50 text-green-700 border-green-200",
      em_andamento: "bg-blue-50 text-blue-700 border-blue-200",
      atrasado: "bg-red-50 text-red-700 border-red-200"
    };

    const labels = {
      concluido: "Concluído",
      em_andamento: "Em Andamento",
      atrasado: "Atrasado"
    };  

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
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
      <div className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-20"} transition-all`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-30 px-8">
          <div className="h-full flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar ciclos, departamentos..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">

              <button
                onClick={handleLogout}
                className=" px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-all"
              >
                Sair
              </button>

              <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  {/* Mudar para o nome da empresa */}
                  <p className="text-sm font-medium text-gray-900">{session?.user.companyId}</p>
                  <p className="text-xs text-gray-500">Plano Enterprise</p>
                </div>
                <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold">
                  TS
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="pt-20 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard Executivo</h1>
            <p className="text-gray-600">Visão geral do desempenho dos ciclos estratégicos</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-[#3B82F6]" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total de Ciclos</p>
              <p className="text-3xl font-semibold text-gray-900">{totalCiclos}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Concluídos</p>
              <p className="text-3xl font-semibold text-gray-900">{ciclosConcluidos}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#3B82F6]" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Em Andamento</p>
              <p className="text-3xl font-semibold text-gray-900">{ciclosAndamento}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-[#EF4444]" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Atrasados</p>
              <p className="text-3xl font-semibold text-gray-900">{ciclosAtrasados}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-[#1E3A5F] to-[#3B82F6] rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-white/80 mb-1">Taxa de Conclusão</p>
              <p className="text-3xl font-semibold">{percentualConclusao}%</p>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Department Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Desempenho por Departamento</h3>
                  <p className="text-sm text-gray-600">Ciclos por status</p>
                </div>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData} id="dept-chart">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" interval={0} />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="concluidos" fill="#10B981" name="Concluídos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="emAndamento" fill="#3B82F6" name="Em Andamento" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="atrasados" fill="#EF4444" name="Atrasados" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Timeline Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Evolução Temporal</h3>
                  <p className="text-sm text-gray-600">Ciclos concluídos por mês</p>
                </div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData} id="timeline-chart">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" interval={0} />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ciclos"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Rankings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Top Concluídos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Mais Concluídos</h3>
                  <p className="text-xs text-gray-600">Top 5 departamentos</p>
                </div>
              </div>

              <div className="space-y-3">
                {rankingConcluidos.slice(0, 5).map((dept, index) => (
                  <div key={dept.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center text-xs font-semibold text-[#10B981]">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{dept.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{dept.concluidos}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Em Andamento */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Em Andamento</h3>
                  <p className="text-xs text-gray-600">Top 5 departamentos</p>
                </div>
              </div>

              <div className="space-y-3">
                {rankingAndamento.slice(0, 5).map((dept, index) => (
                  <div key={dept.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-xs font-semibold text-[#3B82F6]">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{dept.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{dept.emAndamento}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Atrasados */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Atrasados</h3>
                  <p className="text-xs text-gray-600">Requer atenção</p>
                </div>
              </div>

              <div className="space-y-3">
                {rankingAtrasados.slice(0, 5).map((dept, index) => (
                  <div key={dept.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-red-50 rounded-full flex items-center justify-center text-xs font-semibold text-[#EF4444]">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{dept.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{dept.atrasados}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Cycles Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ciclos Estratégicos Recentes</h3>
                  <p className="text-sm text-gray-600">Últimas atualizações</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors">
                  Ver todos
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nome do Ciclo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Prazo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Responsável
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentCycles.map((cycle) => (
                    <tr key={cycle.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{cycle.nome}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{cycle.departamento}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(cycle.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {new Date(cycle.prazo).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {cycle.responsavel.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm text-gray-700">{cycle.responsavel}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

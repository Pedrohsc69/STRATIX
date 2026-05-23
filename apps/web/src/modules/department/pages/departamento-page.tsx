import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Plus, Users, Target, LayoutGrid, List, Building2, LayoutDashboard, FileText, Settings } from "lucide-react";
import { motion } from "motion/react";

interface Department {
  id: string;
  name: string;
  manager: string;
  cyclesCount: number;
  completionRate: number;
  status: "active" | "planning" | "review";
}

// Mock data
const mockDepartments: Department[] = [
  {
    id: "1",
    name: "Marketing",
    manager: "Ana Silva",
    cyclesCount: 8,
    completionRate: 75,
    status: "active",
  },
  {
    id: "2",
    name: "Vendas",
    manager: "Carlos Mendes",
    cyclesCount: 12,
    completionRate: 82,
    status: "active",
  },
  {
    id: "3",
    name: "Tecnologia",
    manager: "João Santos",
    cyclesCount: 15,
    completionRate: 68,
    status: "active",
  },
  {
    id: "4",
    name: "Recursos Humanos",
    manager: "Maria Oliveira",
    cyclesCount: 5,
    completionRate: 90,
    status: "review",
  },
  {
    id: "5",
    name: "Financeiro",
    manager: "Pedro Costa",
    cyclesCount: 7,
    completionRate: 85,
    status: "active",
  },
  {
    id: "6",
    name: "Operações",
    manager: "Juliana Ferreira",
    cyclesCount: 10,
    completionRate: 72,
    status: "active",
  },
];
import { getSession } from "../../../store/app-store";
import stratix_logo_princpial from "../components/Principal_normal.png";



const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: false, path: "/dashboard" },
  { icon: Building2, label: "Departamentos", active: true, path: "/departaments" },
  { icon: Target, label: "Ciclos Estratégicos", active: false, path: "/dashboard-cycles" },
  { icon: FileText, label: "Relatórios", active: false, path: "/reports" },
  { icon: Users, label: "Funcionários", active: false, path: "/employees" },
  { icon: Settings, label: "Configurações", active: false, path: "/settings" }
];

export function DepartmentsPage() {
  const navigate = useNavigate();
  const session = getSession();
  const [sidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [departments] = useState<Department[]>(mockDepartments);

  // Filter departments based on search
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDepartmentClick = (id: string) => {
    navigate(`/departamentos/${id}`);
  };

  const handleNewDepartment = () => {
    navigate("/departamentos/novo");
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
                <img src={stratix_logo_princpial} alt="stratix_logo_horizontal" />
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
            <span className="text-[#1F2937] font-medium">Departamentos</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-[#1F2937] mb-2">Departamentos</h1>
              <p className="text-[#6B7280]">
                Gerencie a estrutura organizacional da sua empresa
              </p>
            </div>
            <button
              onClick={handleNewDepartment}
              className="flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Novo Departamento
            </button>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Buscar departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 bg-[#F5F7FA] rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-[#1E3A5F]"
                    : "text-[#6B7280]"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-white shadow-sm text-[#1E3A5F]"
                    : "text-[#6B7280]"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredDepartments.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-[#1E3A5F]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1F2937] mb-2">
              {searchTerm ? "Nenhum departamento encontrado" : "Nenhum departamento criado"}
            </h3>
            <p className="text-[#6B7280] mb-6 max-w-md mx-auto">
              {searchTerm
                ? "Tente ajustar sua busca ou filtros"
                : "Crie departamentos para organizar sua empresa"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleNewDepartment}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all"
              >
                <Plus className="w-5 h-5" />
                Criar primeiro departamento
              </button>
            )}
          </div>
        ) : (
          /* Departments Grid */
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredDepartments.map((dept) => (
              <div
                key={dept.id}
                onClick={() => handleDepartmentClick(dept.id)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-[#1E3A5F] transition-all group"
              >
                {/* Department Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-1 group-hover:text-[#1E3A5F] transition-colors">
                      {dept.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                      <Users className="w-4 h-4" />
                      <span>{dept.manager}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#1E3A5F]" />
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Ciclos ativos</span>
                    <span className="font-semibold text-[#1F2937]">{dept.cyclesCount}</span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[#6B7280]">Taxa de conclusão</span>
                      <span className="font-semibold text-[#1F2937]">
                        {dept.completionRate}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0EA5E9] rounded-full transition-all"
                        style={{ width: `${dept.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      dept.status === "active"
                        ? "bg-[#D1FAE5] text-[#065F46]"
                        : dept.status === "planning"
                        ? "bg-[#DBEAFE] text-[#1E40AF]"
                        : "bg-[#FEF3C7] text-[#92400E]"
                    }`}
                  >
                    {dept.status === "active"
                      ? "Ativo"
                      : dept.status === "planning"
                      ? "Planejamento"
                      : "Em revisão"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Counter */}
        {filteredDepartments.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B7280]">
              Exibindo {filteredDepartments.length} de {departments.length} departamentos
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

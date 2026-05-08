import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Plus, Users, Target, TrendingUp, LayoutGrid, List } from "lucide-react";

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

export function Departments() {
  const navigate = useNavigate();
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
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-semibold text-xl text-[#1F2937]">STRATIX</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => navigate("/dashboard-director")}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#6B7280] hover:bg-[#F5F7FA] rounded-lg transition-colors"
              >
                <LayoutGrid className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </button>
            </li>
            <li>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-[#1E3A5F] bg-[#EFF6FF] rounded-lg"
              >
                <Target className="w-5 h-5" />
                <span className="font-medium">Departamentos</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-[#6B7280] hover:bg-[#F5F7FA] rounded-lg transition-colors">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Ciclos Estratégicos</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-[#6B7280] hover:bg-[#F5F7FA] rounded-lg transition-colors">
                <Users className="w-5 h-5" />
                <span className="font-medium">Funcionários</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

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

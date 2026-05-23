import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search,
  Plus,
  Filter,
  Users,
  Shield,
  UserCheck,
  UserCog,
  User,
  Mail,
  Eye,
  Edit,
  Trash2,
  Send,
  LayoutDashboard,
  Building2,
  FileText,
  Clock,
  BarChart3,
  Target,
  Settings,
} from "lucide-react";
import { getSession } from "../../../store/app-store";
import { motion } from "motion/react";
import logoMain from "@/shared/assets/logos/originals/logo-main.png";




interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: "director" | "manager" | "collaborator";
  status: "active" | "pending" | "inactive";
  joinedAt: string;
  avatar?: string;
}

// Mock data
const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "Diretor Silva",
    email: "diretor@stratix.com",
    department: "Diretoria",
    role: "director",
    status: "active",
    joinedAt: "2026-01-15",
  },
  {
    id: "2",
    name: "Ana Silva",
    email: "ana.silva@stratix.com",
    department: "Marketing",
    role: "manager",
    status: "active",
    joinedAt: "2026-02-01",
  },
  {
    id: "3",
    name: "Carlos Mendes",
    email: "carlos.mendes@stratix.com",
    department: "Vendas",
    role: "manager",
    status: "active",
    joinedAt: "2026-02-10",
  },
  {
    id: "4",
    name: "João Santos",
    email: "joao.santos@stratix.com",
    department: "Tecnologia",
    role: "manager",
    status: "active",
    joinedAt: "2026-02-15",
  },
  {
    id: "5",
    name: "Maria Oliveira",
    email: "maria.oliveira@stratix.com",
    department: "Recursos Humanos",
    role: "manager",
    status: "active",
    joinedAt: "2026-03-01",
  },
  {
    id: "6",
    name: "Pedro Costa",
    email: "pedro.costa@stratix.com",
    department: "Financeiro",
    role: "manager",
    status: "active",
    joinedAt: "2026-03-05",
  },
  {
    id: "7",
    name: "Juliana Ferreira",
    email: "juliana.ferreira@stratix.com",
    department: "Operações",
    role: "manager",
    status: "active",
    joinedAt: "2026-03-10",
  },
  {
    id: "8",
    name: "Lucas Almeida",
    email: "lucas.almeida@stratix.com",
    department: "Marketing",
    role: "collaborator",
    status: "active",
    joinedAt: "2026-04-01",
  },
  {
    id: "9",
    name: "Beatriz Lima",
    email: "beatriz.lima@stratix.com",
    department: "Marketing",
    role: "collaborator",
    status: "active",
    joinedAt: "2026-04-05",
  },
  {
    id: "10",
    name: "Rafael Souza",
    email: "rafael.souza@stratix.com",
    department: "Vendas",
    role: "collaborator",
    status: "pending",
    joinedAt: "2026-05-10",
  },
  {
    id: "11",
    name: "Camila Rodrigues",
    email: "camila.rodrigues@stratix.com",
    department: "Tecnologia",
    role: "collaborator",
    status: "active",
    joinedAt: "2026-04-15",
  },
  {
    id: "12",
    name: "Fernando Martins",
    email: "fernando.martins@stratix.com",
    department: "Tecnologia",
    role: "collaborator",
    status: "pending",
    joinedAt: "2026-05-11",
  },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: false, path: "/dashboard" },
  { icon: Building2, label: "Departamentos", active: false, path: "/departaments" },
  { icon: Target, label: "Ciclos Estratégicos", active: false, path: "/dashboard-cycles" },
  { icon: FileText, label: "Relatórios", active: false, path: "/reports" },
  { icon: Users, label: "Funcionários", active: true, path: "/employees" },
  { icon: Settings, label: "Configurações", active: false, path: "/settings" }
];

export function EmployeesPage() {
  const navigate = useNavigate();
  const [sidebarOpen] = useState(true);
  const session = getSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employees] = useState<Employee[]>(mockEmployees);

  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;
    const matchesRole = roleFilter === "all" || employee.role === roleFilter;
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  // Calculate KPIs
  const totalEmployees = employees.length;
  const totalManagers = employees.filter((e) => e.role === "manager").length;
  const totalCollaborators = employees.filter((e) => e.role === "collaborator").length;
  const pendingInvites = employees.filter((e) => e.status === "pending").length;

  // Department distribution
  const departmentCounts = employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedDepartments = Object.entries(departmentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Get unique departments
  const departments = Array.from(new Set(employees.map((e) => e.department)));

  const getRoleConfig = (role: Employee["role"]) => {
    const configs = {
      director: {
        label: "Diretor",
        color: "bg-[#1E3A5F] text-white border-[#1E3A5F]",
        icon: Shield,
      },
      manager: {
        label: "Gestor",
        color: "bg-[#DBEAFE] text-[#1E40AF] border-[#2563EB]",
        icon: UserCog,
      },
      collaborator: {
        label: "Colaborador",
        color: "bg-[#F5F7FA] text-[#6B7280] border-[#9CA3AF]",
        icon: User,
      },
    };
    return configs[role];
  };

  const getStatusConfig = (status: Employee["status"]) => {
    const configs = {
      active: {
        label: "Ativo",
        color: "bg-[#D1FAE5] text-[#065F46] border-[#10B981]",
      },
      pending: {
        label: "Convite Pendente",
        color: "bg-[#FEF3C7] text-[#92400E] border-[#D97706]",
      },
      inactive: {
        label: "Inativo",
        color: "bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]",
      },
    };
    return configs[status];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleInviteEmployee = () => {
    navigate("/funcionarios/convidar");
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
            <span className="text-[#1F2937] font-medium">Funcionários</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-[#1F2937] mb-2">Funcionários</h1>
              <p className="text-[#6B7280]">Gerencie gestores e colaboradores da empresa</p>
            </div>
            <button
              onClick={handleInviteEmployee}
              className="flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Convidar Funcionário
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#6B7280]">Total de Funcionários</span>
              <Users className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <p className="text-3xl font-semibold text-[#1F2937]">{totalEmployees}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#6B7280]">Gestores</span>
              <UserCog className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-3xl font-semibold text-[#2563EB]">{totalManagers}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#6B7280]">Colaboradores</span>
              <UserCheck className="w-5 h-5 text-[#6B7280]" />
            </div>
            <p className="text-3xl font-semibold text-[#1F2937]">{totalCollaborators}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#6B7280]">Convites Pendentes</span>
              <Clock className="w-5 h-5 text-[#D97706]" />
            </div>
            <p className="text-3xl font-semibold text-[#D97706]">{pendingInvites}</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Filters Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="Buscar funcionário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-[#6B7280]" />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm"
                  >
                    <option value="all">Todos departamentos</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm"
                  >
                    <option value="all">Todas as funções</option>
                    <option value="director">Diretor</option>
                    <option value="manager">Gestor</option>
                    <option value="collaborator">Colaborador</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm"
                  >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativo</option>
                    <option value="pending">Pendente</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employees Table */}
            {filteredEmployees.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#1E3A5F]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1F2937] mb-2">
                  {searchTerm || departmentFilter !== "all" || roleFilter !== "all"
                    ? "Nenhum funcionário encontrado"
                    : "Nenhum funcionário cadastrado"}
                </h3>
                <p className="text-[#6B7280] mb-6 max-w-md mx-auto">
                  {searchTerm || departmentFilter !== "all" || roleFilter !== "all"
                    ? "Tente ajustar sua busca ou filtros"
                    : "Convide gestores e colaboradores para estruturar sua organização."}
                </p>
                {!searchTerm && departmentFilter === "all" && roleFilter === "all" && (
                  <button
                    onClick={handleInviteEmployee}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Convidar primeiro funcionário
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
                          Funcionário
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          E-mail
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Departamento
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Função
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Data de Entrada
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredEmployees.map((employee) => {
                        const roleConfig = getRoleConfig(employee.role);
                        const statusConfig = getStatusConfig(employee.status);
                        const RoleIcon = roleConfig.icon;
                        return (
                          <tr
                            key={employee.id}
                            className="hover:bg-[#F9FAFB] transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#1E40AF] font-semibold text-sm">
                                  {getInitials(employee.name)}
                                </div>
                                <div>
                                  <div className="font-medium text-[#1F2937]">
                                    {employee.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                <Mail className="w-4 h-4" />
                                <span>{employee.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-[#1F2937]">
                                {employee.department}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${roleConfig.color}`}
                              >
                                <RoleIcon className="w-3.5 h-3.5" />
                                {roleConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                              >
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-[#6B7280]">
                                {formatDate(employee.joinedAt)}
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
                                {employee.status === "pending" && (
                                  <button className="p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors text-[#6B7280] hover:text-[#D97706]">
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                                <button className="p-2 hover:bg-[#FEE2E2] rounded-lg transition-colors text-[#6B7280] hover:text-[#DC2626]">
                                  <Trash2 className="w-4 h-4" />
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

            {filteredEmployees.length > 0 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-[#6B7280]">
                  Exibindo {filteredEmployees.length} de {employees.length} funcionários
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Distribution */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#1E3A5F]" />
                Distribuição Organizacional
              </h3>

              <div className="mb-6">
                <div className="text-sm font-medium text-[#6B7280] mb-3">Por Função</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#1E3A5F]" />
                        <span className="text-sm text-[#1F2937]">Diretor</span>
                      </div>
                      <span className="text-sm font-semibold text-[#1F2937]">1</span>
                    </div>
                    <div className="w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1E3A5F] rounded-full"
                        style={{
                          width: `${(1 / totalEmployees) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-sm text-[#1F2937]">Gestores</span>
                      </div>
                      <span className="text-sm font-semibold text-[#1F2937]">
                        {totalManagers}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563EB] rounded-full"
                        style={{
                          width: `${(totalManagers / totalEmployees) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#6B7280]" />
                        <span className="text-sm text-[#1F2937]">Colaboradores</span>
                      </div>
                      <span className="text-sm font-semibold text-[#1F2937]">
                        {totalCollaborators}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#9CA3AF] rounded-full"
                        style={{
                          width: `${(totalCollaborators / totalEmployees) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="text-sm font-medium text-[#6B7280] mb-3">
                  Por Departamento
                </div>
                <div className="space-y-3">
                  {sortedDepartments.map(([dept, count]) => (
                    <div key={dept}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#1F2937]">{dept}</span>
                        <span className="text-sm font-semibold text-[#1F2937]">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0EA5E9] rounded-full"
                          style={{
                            width: `${(count / totalEmployees) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  User,
  Mail,
  Lock,
  Building2,
  FileText,
  Briefcase,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  Target,
  TrendingUp,
  Users,
  Plus,
  X,
  ArrowRight,
  Check,
  Sparkles,
  Network,
  AlertCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";

const dashboardData = [
  { name: "Q1", value: 65 },
  { name: "Q2", value: 78 },
  { name: "Q3", value: 92 },
  { name: "Q4", value: 118 }
];

interface Department {
  id: string;
  name: string;
  managerName: string;
}

interface OnboardingData {
  // Step 1 - Diretor
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  // Step 2 - Empresa
  companyName: string;
  cnpj: string;
  businessArea: string;
  // Step 3 - Departamentos
  departments: Department[];
  // Step 4 - Convites
  invites: Array<{
    email: string;
    role: string;
    department: string;
  }>;
}

export  function RegisterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<OnboardingData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    companyName: "",
    cnpj: "",
    businessArea: "",
    departments: [],
    invites: []
  });

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    managerName: ""
  });

  const [newInvite, setNewInvite] = useState({
    email: "",
    role: "Colaborador",
    department: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { number: 1, title: "Conta de Diretor" },
    { number: 2, title: "Empresa" },
    { number: 3, title: "Departamentos" },
    { number: 4, title: "Equipe" }
  ];

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const limited = cleaned.substring(0, 14);

    if (limited.length <= 2) return limited;
    if (limited.length <= 5) return `${limited.slice(0, 2)}.${limited.slice(2)}`;
    if (limited.length <= 8) return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`;
    if (limited.length <= 12) return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`;
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`;
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Nome completo é obrigatório";
      if (!formData.email) newErrors.email = "E-mail é obrigatório";
      if (!formData.password || formData.password.length < 8) newErrors.password = "Senha deve ter no mínimo 8 caracteres";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "As senhas não coincidem";
      if (!formData.termsAccepted) newErrors.terms = "Você deve aceitar os termos";
    }

    if (step === 2) {
      if (!formData.companyName.trim()) newErrors.companyName = "Nome da empresa é obrigatório";
      if (!formData.cnpj || formData.cnpj.replace(/\D/g, "").length !== 14) newErrors.cnpj = "CNPJ inválido";
      if (!formData.businessArea) newErrors.businessArea = "Área de atuação é obrigatória";
    }

    if (step === 3) {
      if (formData.departments.length === 0) {
        newErrors.departments = "Crie pelo menos um departamento para continuar";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleAddDepartment = () => {
    if (!newDepartment.name.trim()) {
      setErrors({ ...errors, departmentName: "Nome do departamento é obrigatório" });
      return;
    }

    const department: Department = {
      id: Date.now().toString(),
      name: newDepartment.name.trim(),
      managerName: newDepartment.managerName.trim()
    };

    setFormData({
      ...formData,
      departments: [...formData.departments, department]
    });

    setNewDepartment({ name: "", managerName: "" });

    // Clear department error if it exists
    const newErrors = { ...errors };
    delete newErrors.departmentName;
    delete newErrors.departments;
    setErrors(newErrors);
  };

  const handleRemoveDepartment = (id: string) => {
    setFormData({
      ...formData,
      departments: formData.departments.filter(dept => dept.id !== id)
    });
  };

  const handleAddInvite = () => {
    const newErrors: Record<string, string> = {};

    if (!newInvite.email) {
      newErrors.inviteEmail = "E-mail é obrigatório";
    }
    if (!newInvite.department) {
      newErrors.inviteDepartment = "Selecione um departamento";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors({ ...errors, ...newErrors });
      return;
    }

    setFormData({
      ...formData,
      invites: [...formData.invites, { ...newInvite }]
    });
    setNewInvite({ email: "", role: "Colaborador", department: "" });

    // Clear invite errors
    const clearedErrors = { ...errors };
    delete clearedErrors.inviteEmail;
    delete clearedErrors.inviteDepartment;
    setErrors(clearedErrors);
  };

  const handleRemoveInvite = (index: number) => {
    setFormData({
      ...formData,
      invites: formData.invites.filter((_, i) => i !== index)
    });
  };

  const handleFinish = () => {
    setCurrentStep(5);
    console.log("Onboarding completed:", formData);
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard-general");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 border border-white rounded-full" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-white rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white rounded" />
            </div>
            <span className="text-2xl font-semibold text-white tracking-tight">STRATIX</span>
          </div>

          {/* Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h1 className="text-4xl xl:text-5xl font-semibold text-white leading-tight mb-6">
              Estruture a estratégia da sua empresa com precisão
            </h1>
            <p className="text-lg text-white/80 mb-12 leading-relaxed max-w-md">
              Plataforma completa para planejamento estratégico, gestão de OKRs e decisões baseadas em dados.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="space-y-6 mb-12"
          >
            {[
              "Planejamento estratégico integrado",
              "Gestão de OKRs e metas corporativas",
              "Tomada de decisão baseada em evidências",
              "Controle organizacional estruturado"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-accent rounded flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <p className="text-white/90">{item}</p>
              </div>
            ))}
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <p className="text-sm text-white/90 font-medium">Crescimento Estratégico</p>
            </div>
            <p className="text-3xl font-semibold text-white mb-4">+81%</p>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={dashboardData}>
                <XAxis dataKey="name" stroke="#ffffff60" fontSize={10} tickLine={false} axisLine={false} />
                <Bar dataKey="value" fill="#2BB3A3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Multi-Step Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-lg"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-accent rounded" />
            </div>
            <span className="text-xl font-semibold text-primary tracking-tight">STRATIX</span>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-border p-8">
            {/* Progress Indicator */}
            {currentStep < 5 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                            currentStep > step.number
                              ? "bg-accent text-white"
                              : currentStep === step.number
                              ? "bg-primary text-white"
                              : "bg-background text-muted-foreground"
                          }`}
                        >
                          {currentStep > step.number ? (
                            <Check className="w-5 h-5" strokeWidth={3} />
                          ) : (
                            step.number
                          )}
                        </div>
                        <p className="text-xs mt-2 text-center text-muted-foreground">{step.title}</p>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-2 transition-all ${
                            currentStep > step.number ? "bg-accent" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Badge */}
            {currentStep < 5 && (
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">
                  {currentStep === 1 ? "Acesso seguro corporativo" : "Seus dados são protegidos"}
                </span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1 - Cadastro do Diretor */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-primary mb-2">Crie sua conta de Diretor</h2>
                    <p className="text-muted-foreground">Você terá controle total sobre a estrutura organizacional</p>
                  </div>

                  <div className="space-y-4">
                    {/* Nome Completo */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nome completo</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className={`w-full pl-12 pr-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.fullName ? "border-destructive" : "border-border focus:ring-accent"
                          }`}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      {errors.fullName && <p className="mt-1.5 text-sm text-destructive">{errors.fullName}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">E-mail corporativo</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`w-full pl-12 pr-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.email ? "border-destructive" : "border-border focus:ring-accent"
                          }`}
                          placeholder="seu.email@empresa.com"
                        />
                      </div>
                      {errors.email && <p className="mt-1.5 text-sm text-destructive">{errors.email}</p>}
                    </div>

                    {/* Senha */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className={`w-full pl-12 pr-12 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.password ? "border-destructive" : "border-border focus:ring-accent"
                          }`}
                          placeholder="Mínimo 8 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1.5 text-sm text-destructive">{errors.password}</p>}
                    </div>

                    {/* Confirmar Senha */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Confirmar senha</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className={`w-full pl-12 pr-12 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.confirmPassword ? "border-destructive" : "border-border focus:ring-accent"
                          }`}
                          placeholder="Digite a senha novamente"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="mt-1.5 text-sm text-destructive">{errors.confirmPassword}</p>}
                    </div>

                    {/* Termos */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.termsAccepted}
                          onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                          className="w-5 h-5 rounded border-border text-accent focus:ring-accent mt-0.5"
                        />
                        <span className="text-sm text-foreground flex-1">
                          Aceito os{" "}
                          <a href="#" className="text-accent hover:text-accent/80 font-medium">
                            termos de uso
                          </a>
                          {" "}e{" "}
                          <a href="#" className="text-accent hover:text-accent/80 font-medium">
                            política de privacidade
                          </a>
                        </span>
                      </label>
                      {errors.terms && <p className="mt-1.5 text-sm text-destructive">{errors.terms}</p>}
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full mt-6 py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* Step 2 - Criação da Empresa */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-primary mb-2">Configure sua empresa</h2>
                    <p className="text-muted-foreground">Essas informações estruturam seu ambiente organizacional</p>
                  </div>

                  <div className="space-y-4">
                    {/* Nome da Empresa */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nome da empresa</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className={`w-full pl-12 pr-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.companyName ? "border-destructive" : "border-border focus:ring-accent"
                          }`}
                          placeholder="Razão social ou nome fantasia"
                        />
                      </div>
                      {errors.companyName && <p className="mt-1.5 text-sm text-destructive">{errors.companyName}</p>}
                    </div>

                    {/* CNPJ */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">CNPJ</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={formatCNPJ(formData.cnpj)}
                          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          className={`w-full pl-12 pr-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.cnpj ? "border-destructive" : "border-border focus:ring-accent"
                          }`}
                          placeholder="00.000.000/0000-00"
                        />
                      </div>
                      {errors.cnpj && <p className="mt-1.5 text-sm text-destructive">{errors.cnpj}</p>}
                    </div>

                    {/* Área de Atuação */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Área de atuação</label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <select
                          value={formData.businessArea}
                          onChange={(e) => setFormData({ ...formData, businessArea: e.target.value })}
                          className={`w-full pl-12 pr-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none ${
                            errors.businessArea ? "border-destructive" : "border-border focus:ring-accent"
                          }`}
                        >
                          <option value="">Selecione uma área</option>
                          <option value="tecnologia">Tecnologia</option>
                          <option value="servicos">Serviços</option>
                          <option value="industria">Indústria</option>
                          <option value="comercio">Comércio</option>
                          <option value="financeiro">Financeiro</option>
                          <option value="saude">Saúde</option>
                          <option value="educacao">Educação</option>
                          <option value="construcao">Construção</option>
                          <option value="outros">Outros</option>
                        </select>
                      </div>
                      {errors.businessArea && <p className="mt-1.5 text-sm text-destructive">{errors.businessArea}</p>}
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full mt-6 py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* Step 3 - Criação de Departamentos */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-primary mb-2">Crie a estrutura inicial da sua empresa</h2>
                    <p className="text-muted-foreground">Usuários precisam estar vinculados a um departamento</p>
                  </div>

                  {/* Organization Hierarchy Info */}
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Network className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Estrutura Organizacional</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-2 py-1 bg-primary/10 rounded text-primary font-medium">Empresa</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="px-2 py-1 bg-accent/10 rounded text-accent font-medium">Departamento</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="px-2 py-1 bg-secondary/10 rounded text-secondary font-medium">Usuário</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add Department Form */}
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nome do departamento</label>
                      <div className="relative">
                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={newDepartment.name}
                          onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                          className={`w-full pl-12 pr-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.departmentName ? "border-destructive" : "border-border focus:ring-accent"
                          }`}
                          placeholder="Ex: Comercial, Marketing, Tecnologia"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddDepartment()}
                        />
                      </div>
                      {errors.departmentName && <p className="mt-1.5 text-sm text-destructive">{errors.departmentName}</p>}
                    </div>

                    <button
                      onClick={handleAddDepartment}
                      className="w-full py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Adicionar departamento
                    </button>
                  </div>

                  {/* Departments List */}
                  {formData.departments.length > 0 ? (
                    <div className="space-y-2 mb-6">
                      <p className="text-sm font-medium text-foreground mb-3">
                        Departamentos criados ({formData.departments.length})
                      </p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {formData.departments.map((dept) => (
                          <div
                            key={dept.id}
                            className="flex items-center justify-between p-4 bg-background border border-border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{dept.name}</p>
                              {dept.managerName && (
                                <p className="text-xs text-muted-foreground mt-1">Gestor: {dept.managerName}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveDepartment(dept.id)}
                              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center mb-6">
                      <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">Nenhum departamento criado ainda</p>
                      <p className="text-xs text-muted-foreground mt-1">Crie pelo menos um para continuar</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {errors.departments && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-destructive">{errors.departments}</p>
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    disabled={formData.departments.length === 0}
                    className="w-full py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* Step 4 - Convite de Usuários */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-primary mb-2">Convide sua equipe</h2>
                    <p className="text-muted-foreground">Adicione gestores e colaboradores aos departamentos</p>
                  </div>

                  {/* Add Invite Form */}
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
                      <input
                        type="email"
                        value={newInvite.email}
                        onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                        className={`w-full px-4 py-2.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                          errors.inviteEmail ? "border-destructive" : "border-border focus:ring-accent"
                        }`}
                        placeholder="email@empresa.com"
                      />
                      {errors.inviteEmail && <p className="mt-1.5 text-sm text-destructive">{errors.inviteEmail}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Papel</label>
                        <select
                          value={newInvite.role}
                          onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value })}
                          className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                        >
                          <option value="Gestor">Gestor</option>
                          <option value="Colaborador">Colaborador</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Departamento</label>
                        <select
                          value={newInvite.department}
                          onChange={(e) => setNewInvite({ ...newInvite, department: e.target.value })}
                          className={`w-full px-4 py-2.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                            errors.inviteDepartment ? "border-destructive" : "border-border focus:ring-accent"
                          }`}
                        >
                          <option value="">Selecione</option>
                          {formData.departments.map((dept) => (
                            <option key={dept.id} value={dept.name}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                        {errors.inviteDepartment && <p className="mt-1.5 text-sm text-destructive">{errors.inviteDepartment}</p>}
                      </div>
                    </div>

                    <button
                      onClick={handleAddInvite}
                      className="w-full px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all font-medium flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Adicionar convite
                    </button>
                  </div>

                  {/* Invites List */}
                  {formData.invites.length > 0 ? (
                    <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                      <p className="text-sm font-medium text-foreground mb-3">
                        Convites adicionados ({formData.invites.length})
                      </p>
                      {formData.invites.map((invite, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-background border border-border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{invite.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded">{invite.role}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{invite.department}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveInvite(index)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center mb-6">
                      <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhum convite adicionado ainda</p>
                      <p className="text-xs text-muted-foreground mt-1">Adicione usuários aos departamentos criados</p>
                    </div>
                  )}

                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Convites serão enviados por e-mail</p>
                        <p className="text-xs text-muted-foreground">
                          Cada usuário receberá um link seguro para ativar sua conta no departamento selecionado.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleFinish}
                    className="w-full py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    Finalizar configuração
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* Step 5 - Confirmação */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-accent" />
                  </div>
                  <h2 className="text-3xl font-semibold text-primary mb-3">Sua empresa está pronta!</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    A plataforma STRATIX foi configurada com sucesso. Comece a estruturar suas estratégias e OKRs agora.
                  </p>

                  <div className="bg-background rounded-xl p-6 mb-8 max-w-sm mx-auto">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground">Empresa</p>
                        <p className="text-sm font-medium text-foreground">Configurada</p>
                      </div>
                      <div>
                        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Target className="w-6 h-6 text-accent" />
                        </div>
                        <p className="text-xs text-muted-foreground">Departamentos</p>
                        <p className="text-sm font-medium text-foreground">{formData.departments.length}</p>
                      </div>
                      <div>
                        <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Users className="w-6 h-6 text-secondary" />
                        </div>
                        <p className="text-xs text-muted-foreground">Convites</p>
                        <p className="text-sm font-medium text-foreground">{formData.invites.length}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGoToDashboard}
                    className="w-full py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    Ir para o dashboard
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

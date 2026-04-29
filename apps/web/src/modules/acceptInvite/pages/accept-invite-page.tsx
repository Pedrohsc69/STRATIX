import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Shield, Lock, Eye, EyeOff, CheckCircle2, User, UserCheck } from "lucide-react";
import { acceptInvite, getInviteDetails } from "../../auth/services/auth-service";
import { saveSession } from "../../../store/app-store";

type InviteDetails = {
  email: string;
  role: "MANAGER" | "EMPLOYEE";
  companyName: string;
  departmentName: string | null;
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const { data } = error.response as { data?: { message?: string | string[] } };
    if (Array.isArray(data?.message)) {
      return data.message[0];
    }
    if (typeof data?.message === "string") {
      return data.message;
    }
  }

  return "Não foi possível processar o convite.";
}

export function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inviteData, setInviteData] = useState<InviteDetails | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const token = searchParams.get("token") ?? "";

  const roleLabel = useMemo(() => {
    if (!inviteData) {
      return "";
    }

    return inviteData.role === "MANAGER" ? "Gestor" : "Colaborador";
  }, [inviteData]);

  useEffect(() => {
    if (!token) {
      setRequestError("Convite inválido ou ausente.");
      setLoadingInvite(false);
      return;
    }

    async function loadInvite() {
      try {
        const details = await getInviteDetails(token);
        setInviteData(details);
      } catch (error) {
        setRequestError(getErrorMessage(error));
      } finally {
        setLoadingInvite(false);
      }
    }

    void loadInvite();
  }, [token]);

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Nome deve ter no mínimo 2 caracteres";
    }

    if (!password || password.length < 8) {
      newErrors.password = "Senha deve ter no mínimo 8 caracteres";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");

    if (!validatePassword() || !token) {
      return;
    }

    setSubmitting(true);

    try {
      const session = await acceptInvite({
        name: name.trim(),
        token,
        password,
        confirmPassword,
      });

      saveSession(session);
      navigate("/dashboard-general");
    } catch (error) {
      setRequestError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Validando convite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent rounded" />
          </div>
          <span className="text-2xl font-semibold text-primary tracking-tight">STRATIX</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-border p-8">
          {/* Security Badge */}
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Acesso seguro </span>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-3xl font-semibold text-primary mb-2">Você foi convidado</h1>
            <p className="text-muted-foreground">Complete seu cadastro para acessar a plataforma</p>
          </div>

          {/* Invite Information */}
          <div className="bg-background rounded-xl p-6 mb-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Empresa</p>
                <p className="text-sm font-medium text-foreground">{inviteData?.companyName ?? "-"}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-32">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Seu e-mail</p>
                  <p className="text-sm font-medium text-foreground">{inviteData?.email ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Papel atribuído</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 rounded-md">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-xs font-medium text-accent">{roleLabel}</span>
                  </div>
                </div>
              </div>

              {inviteData?.departmentName && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-1">Departamento</p>
                  <p className="text-sm font-medium text-foreground">{inviteData.departmentName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {requestError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{requestError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Seu nome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.name ? "border-destructive" : "border-border focus:ring-accent"
                  }`}
                  placeholder="Digite seu nome completo"
                />
              </div>
              {errors.name && <p className="mt-1.5 text-sm text-destructive">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Criar senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            {/* Access Notice */}
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Acesso controlado</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {inviteData?.role === "MANAGER"
                      ? "Como Gestor, você terá acesso aos dados do seu departamento e permissões para gerenciar OKRs e metas da equipe."
                      : "Seu acesso será restrito ao seu departamento, com permissões de visualização e acompanhamento de OKRs atribuídos."}
                  </p>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={submitting || !inviteData}
              className="w-full py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting ? "Ativando conta..." : "Ativar conta"}
              <CheckCircle2 className="w-5 h-5" />
            </motion.button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Ao ativar sua conta, você aceita os{" "}
            <a href="#" className="text-accent hover:text-accent/80">
              termos de uso
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

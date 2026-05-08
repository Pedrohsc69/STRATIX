import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Lock, Eye, EyeOff, Shield, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export  function RecoverPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { level: 1, label: "Fraca", color: "text-red-600" };
    if (strength <= 3) return { level: 2, label: "Média", color: "text-yellow-600" };
    return { level: 3, label: "Forte", color: "text-green-600" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Password requirements
  const requirements = [
    { label: "Mínimo de 8 caracteres", met: newPassword.length >= 8 },
    { label: "Pelo menos um número", met: /\d/.test(newPassword) },
    { label: "Letra maiúscula e minúscula", met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) },
    { label: "Caractere especial (!@#$%)", met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) }
  ];

  // Simulate token validation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    // Simulate token validation (in production, validate against backend)
    if (!token || token === "invalid") {
      setTokenValid(false);
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = "Nova senha é obrigatória";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Senha deve ter no mínimo 8 caracteres";
    } else if (passwordStrength.level < 2) {
      newErrors.newPassword = "Senha muito fraca. Use uma senha mais segura";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Simulate password reset
    console.log("Password reset:", { newPassword });
    setSuccess(true);
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  // Token invalid state
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
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

          <div className="bg-white rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">Link inválido ou expirado</h1>
            <p className="text-muted-foreground mb-8">
              Este link de redefinição de senha não é mais válido. Por favor, solicite um novo link de recuperação.
            </p>
            <button
              onClick={() => navigate("/recuperar-senha")}
              className="w-full py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Solicitar novo link
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
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

          <div className="bg-white rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">Senha atualizada com sucesso!</h1>
            <p className="text-muted-foreground mb-8">
              Sua senha foi redefinida. Agora você pode fazer login com sua nova senha.
            </p>
            <button
              onClick={handleGoToLogin}
              className="w-full py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Ir para login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-md"
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
            {/* Security Badge */}
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Suas informações são protegidas</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-primary mb-2">Redefinir senha</h2>
              <p className="text-muted-foreground">Crie uma nova senha para acessar sua conta</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nova senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.newPassword ? "border-destructive" : "border-border focus:ring-accent"
                    }`}
                    placeholder="Digite sua nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-1.5 text-sm text-destructive">{errors.newPassword}</p>}

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Força da senha:</span>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            level <= passwordStrength.level
                              ? passwordStrength.level === 1
                                ? "bg-red-500"
                                : passwordStrength.level === 2
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
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

              {/* Password Requirements */}
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-3">Requisitos da senha:</p>
                <div className="space-y-2">
                  {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {req.met ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${req.met ? "text-green-700" : "text-muted-foreground"}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Atualizar senha
              </motion.button>
            </form>

            {/* Back to Login */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Lembrou sua senha?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-accent hover:text-accent/80 transition-colors font-medium"
                >
                  Voltar para login
                </button>
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Este link de redefinição expira em 24 horas por segurança
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

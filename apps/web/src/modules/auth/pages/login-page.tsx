import { useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, Shield } from "lucide-react";
import { login } from "../services/auth-service";
import { saveSession } from "../../../store/app-store";
import { StratixLogo } from "../../../shared/components/brand/StratixLogo";




export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      const session = await login({ email, password });
      saveSession(session);
      navigate("/dashboard");
    } catch {
      setError("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden lg:flex-row">
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
          <div className="mb-12 flex items-center gap-2">
            <StratixLogo theme="dark" imgClassName="w-40" />
          </div>

          {/* Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h1 className="text-4xl xl:text-5xl font-semibold text-white leading-tight mb-6">
              Inteligência estratégica para decisões certeiras
            </h1>
            <p className="text-lg text-white/80 mb-12 leading-relaxed max-w-md">
              Plataforma completa para planejar, executar e monitorar estratégias que geram resultados mensuráveis.
            </p>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="space-y-4 mb-12"
          >
            {[
              "Planejamento estratégico integrado",
              "Monitoramento de metas em tempo real",
              "Análise de dados e indicadores",
              "Tomada de decisão baseada em evidências"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-accent rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white/90">{item}</p>
              </div>
            ))}
          </motion.div>

        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto flex w-full max-w-md flex-col items-stretch"
        >
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <StratixLogo theme="light" imgClassName="h-8 w-auto" />
          </div>

          {/* Form Card */}
          <div className="w-full rounded-2xl border border-border bg-white p-6 shadow-xl sm:p-8">
            {/* Security Badge */}
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Acesso seguro</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-primary mb-2">Acesse sua conta</h2>
              <p className="text-muted-foreground">Entre com suas credenciais para continuar</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="seu.email@empresa.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-between">
                <Link to="/forgot-password" className="text-sm text-accent hover:text-accent/80 transition-colors font-medium">
                  Esqueci minha senha
                </Link>
              </div>

              {/* Submit Button */}
            
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading}
                  className="w-full py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </motion.button>
              
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Não possui conta?{" "}
                <Link to="/register" className="text-accent hover:text-accent/80 transition-colors font-medium">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Voltar para página inicial
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

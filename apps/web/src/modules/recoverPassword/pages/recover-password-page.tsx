import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Por favor, informe seu e-mail");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("E-mail inválido");
      return;
    }

    // Simulate API call
    console.log("Password recovery request:", email);
    setSubmitted(true);
  };

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

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-border p-8">
          {!submitted ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-semibold text-primary mb-2">Recuperar senha</h1>
                <p className="text-muted-foreground">
                  Informe seu e-mail cadastrado para receber instruções de recuperação
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">E-mail corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      placeholder="seu.email@empresa.com"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Enviar instruções
                </motion.button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold text-primary mb-3">E-mail enviado!</h2>
              <p className="text-muted-foreground mb-8">
                Verifique sua caixa de entrada. Enviamos instruções para recuperação de senha para <strong className="text-foreground">{email}</strong>
              </p>
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Não recebeu o e-mail? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Voltar para login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

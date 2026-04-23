import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Target, TrendingUp, Users } from "lucide-react";
import { clearSession, getSession } from "../../../store/app-store";

export function DashboardGeneralPage() {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-4xl font-semibold text-primary mb-4">Dashboard - Geral</h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Bem-vindo à plataforma de gestão estratégica e OKRs. Esta é uma área de desenvolvimento.
          </p>
          {session && (
            <div className="mb-8">
              <p className="text-sm text-muted-foreground">
                Sessão ativa: <span className="font-medium text-foreground">{session.user.name}</span>
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Target, title: "OKRs", description: "Gerenciar objetivos" },
              { icon: TrendingUp, title: "Métricas", description: "Acompanhar resultados" },
              { icon: Users, title: "Equipes", description: "Estrutura organizacional" }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="mt-8 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-all"
          >
            Sair
          </button>
        </motion.div>
         
      </div>
    </div>
  );
}

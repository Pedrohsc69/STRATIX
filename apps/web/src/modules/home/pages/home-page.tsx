import { motion } from "motion/react";
import { Link } from "react-router";
import { Target, TrendingUp, BarChart3, Lightbulb, Users, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const chartData = [
  { month: "Jan", value: 45 },
  { month: "Fev", value: 52 },
  { month: "Mar", value: 61 },
  { month: "Abr", value: 58 },
  { month: "Mai", value: 70 },
  { month: "Jun", value: 85 },
  { month: "Jul", value: 92 },
  { month: "Ago", value: 88 },
  { month: "Set", value: 105 },
  { month: "Out", value: 118 },
  { month: "Nov", value: 125 },
  { month: "Dez", value: 142 }
];

const features = [
  {
    icon: Target,
    title: "Planejamento Estratégico",
    description: "Estruture objetivos e defina metas alinhadas à visão organizacional."
  },
  {
    icon: BarChart3,
    title: "Monitoramento de Desempenho",
    description: "Acompanhe resultados em tempo real com indicadores precisos."
  },
  {
    icon: TrendingUp,
    title: "Visualização de Métricas",
    description: "Transforme dados complexos em insights acionáveis."
  },
  {
    icon: Lightbulb,
    title: "Suporte à Decisão",
    description: "Tome decisões estratégicas fundamentadas em evidências."
  },
  {
    icon: Users,
    title: "Alinhamento Organizacional",
    description: "Conecte equipes e garanta execução coordenada."
  }
];

export function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-accent rounded" />
              </div>
              <span className="text-xl font-semibold text-primary tracking-tight">STRATIX</span>
            </motion.div>

            <motion.nav
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-6"
            >
              <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    Login
              </Link>
              <Link to="/register" className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-all shadow-sm">
                Cadastro
              </Link>
            </motion.nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-10"
            >
              <h1 className="text-5xl lg:text-6xl font-semibold text-primary leading-tight mb-6">
                Decisões estratégicas que transformam resultados
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Plataforma de inteligência estratégica que conecta planejamento, execução e análise para impulsionar o crescimento sustentável da sua organização.
              </p>
              <Link to={"/register"}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                  >
                    Explorar a plataforma
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
              </Link>
            </motion.div>

            {/* Chart Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-xl shadow-primary/5 p-8 border border-border">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Crescimento Acumulado</p>
                    <h3 className="text-3xl font-semibold text-primary">+216%</h3>
                  </div>
                  <div className="px-4 py-2 bg-accent/10 rounded-lg">
                    <p className="text-sm font-medium text-accent">12 meses</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="month"
                      stroke="#6B7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#6B7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      formatter={(value) => [`${value}%`, 'Desempenho']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2BB3A3"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#2BB3A3' }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Eficiência</p>
                    <p className="text-lg font-semibold text-foreground">+38%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Precisão</p>
                    <p className="text-lg font-semibold text-foreground">+52%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ROI</p>
                    <p className="text-lg font-semibold text-foreground">+126%</p>
                  </div>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent/10 rounded-2xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-semibold text-primary mb-4">
              Capacidades que impulsionam resultados
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas integradas para planejar, executar e monitorar estratégias com excelência.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-background rounded-xl p-8 border border-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white rounded" />
              </div>
              <span className="text-xl font-semibold tracking-tight">STRATIX</span>
            </div>

            <nav className="flex items-center gap-8">
              <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">Sobre</a>
              <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">Contato</a>
              <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">Termos</a>
              <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">Privacidade</a>
            </nav>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-center text-sm text-white/60">
              © 2026 STRATIX. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

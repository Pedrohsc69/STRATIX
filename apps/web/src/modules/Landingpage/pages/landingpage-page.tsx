import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
  Target,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { StratixLogo } from "../../../shared/components/brand/StratixLogo";

const resourceLinks = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Perfis", href: "#perfis" },
  { label: "Segurança", href: "#seguranca" },
];

const heroStats = [
  { label: "Progresso médio", value: "76%", tone: "text-[#0F2A44]" },
  { label: "OKRs ativos", value: "24", tone: "text-[#2BB3A3]" },
  { label: "Departamentos", value: "5", tone: "text-[#1E4E79]" },
  { label: "Ciclos em andamento", value: "3", tone: "text-[#0F2A44]" },
];

const strategicBenefits = [
  {
    icon: Target,
    title: "Planejamento estratégico integrado",
    description: "Conecte visão, ciclos estratégicos, objetivos e OKRs em um fluxo único de execução.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Gestão de OKRs por departamento",
    description: "Distribua metas por área e acompanhe responsáveis, progresso e dependências com clareza.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboards por perfil",
    description: "Diretores, gestores e colaboradores acessam indicadores alinhados ao seu escopo de atuação.",
  },
  {
    icon: FileSpreadsheet,
    title: "Relatórios PDF e CSV",
    description: "Exporte visão executiva, recortes departamentais e consolidados para apresentação e análise.",
  },
  {
    icon: ScrollText,
    title: "Auditoria de ações críticas",
    description: "Registre operações sensíveis para ampliar rastreabilidade e governança organizacional.",
  },
  {
    icon: ShieldCheck,
    title: "Controle de acesso por função",
    description: "Permissões por papel e escopo garantem visibilidade adequada por empresa e departamento.",
  },
];

const workflowSteps = [
  "Diretor cria a empresa e configura o ambiente organizacional.",
  "Departamentos são cadastrados para estruturar a operação.",
  "Gestores e colaboradores são convidados conforme o papel de cada um.",
  "Ciclos estratégicos, objetivos e OKRs são organizados em uma única plataforma.",
  "O progresso é monitorado em dashboards e relatórios exportáveis.",
];

const roleCards = [
  {
    icon: ShieldCheck,
    title: "Diretor",
    description: "Visão completa da empresa, definição de ciclos, análise consolidada e governança estratégica.",
  },
  {
    icon: UserCog,
    title: "Gestor",
    description: "Gestão do departamento, acompanhamento das metas da equipe e execução operacional dos OKRs.",
  },
  {
    icon: UserRound,
    title: "Colaborador",
    description: "Acompanhamento dos OKRs atribuídos, atualização de progresso e visibilidade do próprio escopo.",
  },
];

const governanceItems = [
  "Autenticação com JWT para controle de sessão.",
  "Senhas armazenadas com hash.",
  "RBAC com isolamento por empresa e departamento.",
  "Auditoria operacional registrada em MongoDB.",
  "Ciclos encerrados preservados em modo somente leitura.",
  "Relatórios e indicadores centralizados para governança executiva.",
];

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#1F2937]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0">
            <StratixLogo variant="light" imgClassName="h-10 w-auto" />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {resourceLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#4B5563] transition-colors hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-[#0F2A44] transition-colors hover:bg-[#F8FAFC]"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent/90 sm:px-5"
            >
              Cadastro
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-[#2BB3A3]/10 blur-3xl" />
            <div className="absolute right-[-8rem] top-24 h-96 w-96 rounded-full bg-[#0F2A44]/8 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#F5F7FA]" />
          </div>

          <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:pb-28">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative z-10"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2BB3A3]/15 bg-[#2BB3A3]/10 px-4 py-2 text-sm font-medium text-[#1E4E79]">
                <BarChart3 className="h-4 w-4" />
                Plataforma acadêmica de planejamento estratégico e OKRs
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-primary sm:text-5xl lg:text-6xl">
                Transforme estratégia em resultados mensuráveis
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Centralize ciclos estratégicos, objetivos e OKRs em uma plataforma corporativa com
                dashboards, relatórios e controle de acesso por perfil.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
                >
                  Começar agora
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3.5 text-base font-medium text-primary transition-colors hover:bg-[#F8FAFC]"
                >
                  Acessar conta
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {heroStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border bg-white/90 p-4 shadow-sm backdrop-blur"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.1 }}
              className="relative z-10"
            >
              <div className="rounded-[2rem] border border-border bg-white p-5 shadow-[0_30px_80px_-45px_rgba(15,42,68,0.35)] sm:p-6">
                <div className="rounded-[1.5rem] bg-[#0F2A44] p-5 text-white sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-white/70">
                        Painel Estratégico
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">Resumo executivo em tempo real</h2>
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-2 text-right">
                      <p className="text-xs text-white/70">Status geral</p>
                      <p className="text-lg font-semibold text-[#7DE3D8]">Saudável</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {heroStats.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                        <p className="text-sm text-white/72">{item.label}</p>
                        <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl bg-white p-5 text-[#1F2937]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Execução consolidada</p>
                        <p className="mt-1 text-3xl font-semibold text-primary">76%</p>
                      </div>
                      <div className="rounded-xl bg-[#2BB3A3]/12 px-4 py-2 text-sm font-semibold text-[#1E4E79]">
                        +12% no último ciclo
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {[
                        { label: "Objetivos críticos", value: 82 },
                        { label: "Metas departamentais", value: 71 },
                        { label: "OKRs corporativos", value: 76 },
                      ].map((metric) => (
                        <div key={metric.label}>
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <p className="text-sm font-medium text-[#1F2937]">{metric.label}</p>
                            <span className="text-sm font-semibold text-[#1E4E79]">
                              {metric.value}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    { title: "Ciclos ativos", value: "3", description: "Execução em andamento" },
                    { title: "Departamentos", value: "5", description: "Estrutura monitorada" },
                    { title: "Relatórios", value: "PDF + CSV", description: "Exportação executiva" },
                  ].map((card) => (
                    <div key={card.title} className="rounded-2xl border border-border bg-[#F8FAFC] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{card.title}</p>
                      <p className="mt-2 text-xl font-semibold text-primary">{card.value}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="recursos" className="bg-[#F8FAFC] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1E4E79]">
                Por que usar o STRATIX?
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
                Uma plataforma para organizar estratégia, execução e governança
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                O STRATIX foi desenhado para reduzir dispersão operacional e transformar planejamento
                em acompanhamento contínuo com visibilidade executiva.
              </p>
            </motion.div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {strategicBenefits.map((feature, index) => (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group rounded-3xl border border-border bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-[#2BB3A3]/30 hover:shadow-lg hover:shadow-[#2BB3A3]/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2BB3A3]/10 text-accent transition-colors group-hover:bg-[#2BB3A3]/20">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-primary">{feature.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1E4E79]">
                Como funciona
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
                Estruturação simples para um acompanhamento corporativo completo
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                O fluxo do STRATIX acompanha o ciclo natural da gestão estratégica, do cadastro da
                empresa até a análise de resultados com exportação de relatórios.
              </p>

              <div className="mt-8 rounded-3xl border border-border bg-[#F8FAFC] p-6">
                <p className="text-sm font-medium text-[#1E4E79]">O que o sistema resolve</p>
                <div className="mt-4 space-y-3">
                  {[
                    "Fragmentação entre planejamento e execução.",
                    "Baixa visibilidade do progresso por departamento.",
                    "Dificuldade para consolidar indicadores estratégicos.",
                    "Pouca rastreabilidade sobre alterações críticas.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="space-y-4">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="flex gap-4 rounded-3xl border border-border bg-white p-5 shadow-sm"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1E4E79]">
                      Etapa {index + 1}
                    </p>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">{step}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="perfis" className="bg-[#F8FAFC] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1E4E79]">
                Perfis de acesso
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
                Visões diferentes para responsabilidades diferentes
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                O sistema distribui informação estratégica conforme o papel de cada usuário, reduzindo
                ruído operacional e mantendo o foco no que realmente importa.
              </p>
            </motion.div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {roleCards.map((role, index) => (
                <motion.article
                  key={role.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="rounded-3xl border border-border bg-white p-7 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F2A44] text-white">
                    <role.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-primary">{role.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {role.description}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="seguranca" className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1E4E79]">
                Segurança e governança
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
                Base preparada para controle, rastreabilidade e consistência operacional
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                O STRATIX combina autenticação, regras de permissão e trilhas de auditoria para apoiar
                um ambiente corporativo mais previsível e seguro.
              </p>

              <div className="mt-8 space-y-4">
                {governanceItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-[#F8FAFC] p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="rounded-[2rem] border border-border bg-[#0F2A44] p-6 text-white shadow-[0_30px_70px_-40px_rgba(15,42,68,0.55)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <LockKeyhole className="h-6 w-6 text-[#7DE3D8]" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-white/70">Governança aplicada</p>
                  <h3 className="mt-1 text-2xl font-semibold">Camadas de proteção integradas</h3>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: LockKeyhole, label: "JWT", detail: "Sessões autenticadas" },
                  { icon: Users, label: "RBAC", detail: "Permissões por perfil" },
                  { icon: Building2, label: "Escopo", detail: "Empresa e departamento" },
                  { icon: ScrollText, label: "Auditoria", detail: "Ações críticas registradas" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <item.icon className="h-5 w-5 text-[#7DE3D8]" />
                    <p className="mt-4 text-lg font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm text-white/72">{item.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="bg-[#F8FAFC] py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-[2rem] border border-border bg-white px-6 py-10 text-center shadow-sm sm:px-10"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1E4E79]">
                Pronto para começar?
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
                Pronto para alinhar estratégia, execução e resultados?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Estruture sua operação com ciclos, objetivos e OKRs em um ambiente preparado para
                dashboards, governança e acompanhamento contínuo.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-primary/92"
                >
                  Criar conta de Diretor
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3.5 text-base font-medium text-primary transition-colors hover:bg-[#F8FAFC]"
                >
                  Entrar no sistema
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-primary py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <StratixLogo variant="dark" imgClassName="h-10 w-auto" />

            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
              <a href="#recursos" className="transition-colors hover:text-white">
                Recursos
              </a>
              <a href="#como-funciona" className="transition-colors hover:text-white">
                Como funciona
              </a>
              <a href="#perfis" className="transition-colors hover:text-white">
                Perfis
              </a>
              <a href="#seguranca" className="transition-colors hover:text-white">
                Segurança
              </a>
            </nav>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-white/70">
              © 2026 STRATIX. Plataforma acadêmica de planejamento estratégico e OKRs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

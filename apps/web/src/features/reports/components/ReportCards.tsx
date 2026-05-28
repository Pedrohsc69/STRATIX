import { Building2, FileDown, Target } from "lucide-react";
import type { ReportType } from "../types/reports.types";

type ReportCardsProps = {
  onGenerate: (type: ReportType) => void;
};

export function ReportCards({ onGenerate }: ReportCardsProps) {
  const items: Array<{
    type: ReportType;
    title: string;
    description: string;
    icon: typeof Building2;
    tone: string;
  }> = [
    {
      type: "COMPANY",
      title: "Relatório Geral da Empresa",
      description:
        "Consolida departamentos, gestores, ciclos estratégicos, objetivos, OKRs e progresso geral.",
      icon: Building2,
      tone: "bg-[#EFF6FF] text-[#1E4E79]",
    },
    {
      type: "CYCLE",
      title: "Relatório por Ciclo Estratégico",
      description:
        "Exporta objetivos, OKRs, responsáveis, progresso e status final do ciclo selecionado.",
      icon: Target,
      tone: "bg-[#E0F2FE] text-[#0F2A44]",
    },
    {
      type: "DEPARTMENT",
      title: "Relatório por Departamento",
      description:
        "Resume gestor, colaboradores, ciclos, objetivos, OKRs e progresso médio do departamento.",
      icon: FileDown,
      tone: "bg-[#ECFDF5] text-[#16A34A]",
    },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-3 md:grid-cols-2 grid-cols-1">
      {items.map((item) => (
        <article
          key={item.type}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.tone}`}>
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1F2937]">{item.title}</h3>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-[#6B7280]">{item.description}</p>
          <button
            type="button"
            onClick={() => onGenerate(item.type)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757]"
          >
            <FileDown className="h-4 w-4" />
            Gerar relatório
          </button>
        </article>
      ))}
    </div>
  );
}

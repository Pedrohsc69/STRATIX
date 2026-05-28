import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, X } from "lucide-react";
import { ProgressIndicator } from "../../dashboard/components/ProgressIndicator";
import { fetchDepartmentDetails } from "../services/departments.service";
import { DepartmentStatusBadge } from "./DepartmentStatusBadge";
import type { DepartmentDetailsResponse } from "../types/departments.types";

type DepartmentDetailsModalProps = {
  departmentId: string;
  onClose: () => void;
};

function getStatusLabel(status: "PENDING" | "ACTIVE" | "DISABLED") {
  if (status === "ACTIVE") {
    return "Ativo";
  }

  if (status === "DISABLED") {
    return "Desabilitado";
  }

  return "Pendente";
}

export function DepartmentDetailsModal({
  departmentId,
  onClose,
}: DepartmentDetailsModalProps) {
  const [data, setData] = useState<DepartmentDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDetails() {
      try {
        setLoading(true);
        const response = await fetchDepartmentDetails(departmentId);

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar os detalhes do departamento.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDetails();

    return () => {
      active = false;
    };
  }, [departmentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">
              Detalhes do departamento
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">
              {data?.department.name ?? "Carregando..."}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 p-2 text-[#6B7280] transition-colors hover:bg-[#F8FAFC]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-[#F8FAFC]"
                />
              ))}
            </div>
            <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-[#F8FAFC]" />
          </div>
        ) : error || !data ? (
          <div className="px-6 py-10">
            <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm text-[#B91C1C]">
              {error ?? "Departamento indisponível."}
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                    <p className="text-sm text-[#6B7280]">Gestor</p>
                    <p className="mt-1 font-semibold text-[#1F2937]">
                      {data.department.manager?.name ?? "Sem gestor atribuído"}
                    </p>
                    {data.department.manager ? (
                      <p className="mt-1 text-sm text-[#6B7280]">
                        {data.department.manager.email}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                    <p className="text-sm text-[#6B7280]">Colaboradores</p>
                    <p className="mt-1 font-semibold text-[#1F2937]">
                      {data.department.collaboratorsCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                    <p className="text-sm text-[#6B7280]">Ciclos vinculados</p>
                    <p className="mt-1 font-semibold text-[#1F2937]">
                      {data.department.cyclesCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                    <p className="text-sm text-[#6B7280]">OKRs vinculados</p>
                    <p className="mt-1 font-semibold text-[#1F2937]">
                      {data.department.okrsCount}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#6B7280]">Saúde do departamento</p>
                      <div className="mt-2">
                        <DepartmentStatusBadge status={data.department.status} />
                      </div>
                    </div>
                    <div className="min-w-40">
                      <ProgressIndicator value={data.department.averageProgress} tone="brand" />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Link
                      to="/dashboard-cycles"
                      className="inline-flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#0F2A44] transition-colors hover:bg-[#F8FAFC]"
                    >
                      Ver ciclos
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/objetivos"
                      className="inline-flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#0F2A44] transition-colors hover:bg-[#F8FAFC]"
                    >
                      Ver objetivos
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/okrs"
                      className="inline-flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#0F2A44] transition-colors hover:bg-[#F8FAFC]"
                    >
                      Ver OKRs
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-[#1F2937]">Colaboradores</h3>
                <div className="mt-4 space-y-3">
                  {data.department.collaborators.length > 0 ? (
                    data.department.collaborators.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 py-3"
                      >
                        <p className="font-medium text-[#1F2937]">{member.name}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {member.email} • {getStatusLabel(member.status)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6B7280]">
                      Nenhum colaborador vinculado a este departamento.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 border-t border-gray-200 px-6 py-6 lg:grid-cols-3">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                  Ciclos
                </h3>
                <div className="space-y-3">
                  {data.department.cycles.length > 0 ? (
                    data.department.cycles.map((cycle) => (
                      <div
                        key={cycle.id}
                        className="rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 py-3"
                      >
                        <p className="font-medium text-[#1F2937]">{cycle.name}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {cycle.objectivesCount} objetivos • {cycle.okrsCount} OKRs
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6B7280]">Nenhum ciclo vinculado.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                  Objetivos
                </h3>
                <div className="space-y-3">
                  {data.department.objectives.length > 0 ? (
                    data.department.objectives.map((objective) => (
                      <div
                        key={objective.id}
                        className="rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 py-3"
                      >
                        <p className="font-medium text-[#1F2937]">{objective.name}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {objective.cycleName} • {objective.okrsCount} OKRs
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6B7280]">Nenhum objetivo vinculado.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                  OKRs
                </h3>
                <div className="space-y-3">
                  {data.department.okrs.length > 0 ? (
                    data.department.okrs.map((okr) => (
                      <div
                        key={okr.id}
                        className="rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 py-3"
                      >
                        <p className="font-medium text-[#1F2937]">{okr.name}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {okr.objectiveName} • Responsável: {okr.responsibleName}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6B7280]">Nenhum OKR vinculado.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

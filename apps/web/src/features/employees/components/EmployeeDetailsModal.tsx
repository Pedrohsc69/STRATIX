import { useEffect, useState } from "react";
import { Mail, Target, X } from "lucide-react";
import { fetchEmployeeDetails } from "../services/employees.service";
import { EmployeeRoleBadge } from "./EmployeeRoleBadge";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";
import type { EmployeeDetailsResponse } from "../types/employees.types";

type EmployeeDetailsModalProps = {
  employeeId: string;
  onClose: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function EmployeeDetailsModal({
  employeeId,
  onClose,
}: EmployeeDetailsModalProps) {
  const [data, setData] = useState<EmployeeDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDetails() {
      try {
        setLoading(true);
        const response = await fetchEmployeeDetails(employeeId);

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar os detalhes do funcionário.");
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
  }, [employeeId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">
              Detalhes do funcionário
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">
              {data?.employee.name ?? "Carregando..."}
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
          <div className="space-y-4 px-6 py-6">
            <div className="h-24 animate-pulse rounded-2xl bg-[#F8FAFC]" />
            <div className="h-48 animate-pulse rounded-2xl bg-[#F8FAFC]" />
          </div>
        ) : error || !data ? (
          <div className="px-6 py-10">
            <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm text-[#B91C1C]">
              {error ?? "Funcionário indisponível."}
            </div>
          </div>
        ) : (
          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                <p className="text-sm text-[#6B7280]">Função</p>
                <div className="mt-2">
                  <EmployeeRoleBadge role={data.employee.role} />
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                <p className="text-sm text-[#6B7280]">Status</p>
                <div className="mt-2">
                  <EmployeeStatusBadge status={data.employee.status} />
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                <p className="text-sm text-[#6B7280]">Departamento</p>
                <p className="mt-1 font-semibold text-[#1F2937]">
                  {data.employee.department?.name ?? "Sem departamento"}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                <p className="text-sm text-[#6B7280]">OKRs atribuídos</p>
                <p className="mt-1 font-semibold text-[#1F2937]">{data.employee.okrsCount}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#1E4E79]" />
                  <div>
                    <p className="text-sm text-[#6B7280]">E-mail</p>
                    <p className="font-medium text-[#1F2937]">{data.employee.email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-[#2BB3A3]" />
                  <div>
                    <p className="text-sm text-[#6B7280]">Entrada no sistema</p>
                    <p className="font-medium text-[#1F2937]">
                      {formatDate(data.employee.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

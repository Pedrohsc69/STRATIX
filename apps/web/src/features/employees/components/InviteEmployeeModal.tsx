import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { DashboardRole } from "../../dashboard/dashboard.types";
import type { EmployeeDepartment } from "../types/employees.types";

type InviteEmployeeModalProps = {
  departments: EmployeeDepartment[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    email: string;
    role: Exclude<DashboardRole, "DIRECTOR">;
    departmentId: string;
  }) => Promise<void>;
};

type FormState = {
  name: string;
  email: string;
  role: "MANAGER" | "EMPLOYEE";
  departmentId: string;
};

export function InviteEmployeeModal({
  departments,
  loading = false,
  error,
  onClose,
  onSubmit,
}: InviteEmployeeModalProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    role: "EMPLOYEE",
    departmentId: "",
  });

  useEffect(() => {
    if (departments.length > 0 && !form.departmentId) {
      setForm((current) => ({
        ...current,
        departmentId: departments[0]?.id ?? "",
      }));
    }
  }, [departments, form.departmentId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      departmentId: form.departmentId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">
              Convite de funcionário
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">
              Convidar novo funcionário
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

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Nome</span>
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
                placeholder="Ex.: Ana Souza"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">E-mail</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
                placeholder="nome@empresa.com"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Função</span>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as FormState["role"],
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              >
                <option value="MANAGER">Gestor</option>
                <option value="EMPLOYEE">Colaborador</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Departamento</span>
              <select
                required
                value={form.departmentId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    departmentId: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              >
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {departments.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#6B7280]">
              Nenhum departamento disponível para receber convites agora.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F8FAFC]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || departments.length === 0}
              className="rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar convite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

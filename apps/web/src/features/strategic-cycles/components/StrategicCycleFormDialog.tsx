import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type {
  StrategicCycleDepartmentOption,
  StrategicCycleItem,
  StrategicCyclePayload,
} from "../types/strategic-cycles.types";

type StrategicCycleFormDialogProps = {
  title: string;
  departments: StrategicCycleDepartmentOption[];
  initialCycle?: StrategicCycleItem | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: StrategicCyclePayload) => Promise<void>;
};

type FormState = StrategicCyclePayload;

function getInitialState(
  departments: StrategicCycleDepartmentOption[],
  cycle?: StrategicCycleItem | null,
): FormState {
  return {
    name: cycle?.name ?? "",
    departmentId: cycle?.departmentId ?? departments[0]?.id ?? "",
    startDate: cycle?.startDate.slice(0, 10) ?? "",
    endDate: cycle?.endDate.slice(0, 10) ?? "",
  };
}

export function StrategicCycleFormDialog({
  title,
  departments,
  initialCycle,
  loading = false,
  error,
  onClose,
  onSubmit,
}: StrategicCycleFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => getInitialState(departments, initialCycle));

  useEffect(() => {
    setForm(getInitialState(departments, initialCycle));
  }, [departments, initialCycle]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      name: form.name.trim(),
      departmentId: form.departmentId,
      startDate: form.startDate,
      endDate: form.endDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">
              Gestão de ciclos
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">{title}</h2>
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
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Nome do ciclo</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              placeholder="Ex.: Ciclo 2026.2"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Departamento</span>
            <select
              required
              value={form.departmentId}
              onChange={(event) =>
                setForm((current) => ({ ...current, departmentId: event.target.value }))
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

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Data de início</span>
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startDate: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Data final</span>
              <input
                required
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endDate: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F8FAFC]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar ciclo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

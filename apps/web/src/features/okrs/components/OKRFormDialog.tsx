import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type {
  OkrItem,
  OkrObjectiveOption,
  OkrPayload,
  OkrResponsibleOption,
} from "../types/okrs.types";

type OKRFormDialogProps = {
  title: string;
  objectives: OkrObjectiveOption[];
  responsibles: OkrResponsibleOption[];
  initialOkr?: OkrItem | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: OkrPayload) => Promise<void>;
};

type FormState = {
  name: string;
  objectiveId: string;
  responsibleId: string;
  targetValue: string;
};

function getInitialState(
  objectives: OkrObjectiveOption[],
  responsibles: OkrResponsibleOption[],
  okr?: OkrItem | null,
): FormState {
  return {
    name: okr?.name ?? "",
    objectiveId: okr?.objectiveId ?? objectives[0]?.id ?? "",
    responsibleId: okr?.responsibleId ?? responsibles[0]?.id ?? "",
    targetValue: okr ? String(okr.targetValue) : "",
  };
}

export function OKRFormDialog({
  title,
  objectives,
  responsibles,
  initialOkr,
  loading = false,
  error,
  onClose,
  onSubmit,
}: OKRFormDialogProps) {
  const [form, setForm] = useState<FormState>(() =>
    getInitialState(objectives, responsibles, initialOkr),
  );

  useEffect(() => {
    setForm(getInitialState(objectives, responsibles, initialOkr));
  }, [objectives, responsibles, initialOkr]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      name: form.name.trim(),
      objectiveId: form.objectiveId,
      responsibleId: form.responsibleId,
      targetValue: Number(form.targetValue),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">Gestão de OKRs</p>
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
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Nome do OKR</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              placeholder="Ex.: Elevar MRR em 20%"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Objetivo</span>
              <select
                required
                value={form.objectiveId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, objectiveId: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              >
                {objectives.map((objective) => (
                  <option key={objective.id} value={objective.id}>
                    {objective.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Responsável</span>
              <select
                required
                value={form.responsibleId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, responsibleId: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              >
                {responsibles.map((responsible) => (
                  <option key={responsible.id} value={responsible.id}>
                    {responsible.name}
                    {responsible.departmentName ? ` • ${responsible.departmentName}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Valor meta</span>
            <input
              required
              type="number"
              min={0.000001}
              step="0.01"
              value={form.targetValue}
              onChange={(event) =>
                setForm((current) => ({ ...current, targetValue: event.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            />
          </label>

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
              disabled={loading}
              className="rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar OKR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

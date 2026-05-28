import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type {
  ObjectiveCycleOption,
  ObjectiveItem,
  ObjectivePayload,
} from "../types/objectives.types";

type ObjectiveFormDialogProps = {
  title: string;
  cycles: ObjectiveCycleOption[];
  initialObjective?: ObjectiveItem | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: ObjectivePayload) => Promise<void>;
};

type FormState = ObjectivePayload;

function getInitialState(
  cycles: ObjectiveCycleOption[],
  objective?: ObjectiveItem | null,
): FormState {
  return {
    name: objective?.name ?? "",
    description: objective?.description ?? "",
    cycleId: objective?.cycleId ?? cycles[0]?.id ?? "",
  };
}

export function ObjectiveFormDialog({
  title,
  cycles,
  initialObjective,
  loading = false,
  error,
  onClose,
  onSubmit,
}: ObjectiveFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => getInitialState(cycles, initialObjective));

  useEffect(() => {
    setForm(getInitialState(cycles, initialObjective));
  }, [cycles, initialObjective]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      cycleId: form.cycleId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">Gestão de objetivos</p>
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
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Nome do objetivo</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              placeholder="Ex.: Elevar retenção de clientes"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Descrição</span>
            <textarea
              required
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              placeholder="Descreva a intenção estratégica do objetivo."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Ciclo estratégico</span>
            <select
              required
              value={form.cycleId}
              onChange={(event) => setForm((current) => ({ ...current, cycleId: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            >
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
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
              {loading ? "Salvando..." : "Salvar objetivo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

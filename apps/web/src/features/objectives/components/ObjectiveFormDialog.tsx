import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type {
  ObjectiveCycleOption,
  ObjectiveDepartmentOption,
  ObjectiveItem,
  ObjectivePriority,
  ObjectiveCycleStatus,
  ObjectivePayload,
} from '../types/objectives.types';

type ObjectiveFormDialogProps = {
  title: string;
  departments: ObjectiveDepartmentOption[];
  cycles: ObjectiveCycleOption[];
  initialObjective?: ObjectiveItem | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: ObjectivePayload) => Promise<void>;
};

type FormState = ObjectivePayload & {
  departmentId: string;
};

const priorityOptions: Array<{ value: ObjectivePriority; label: string }> = [
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'LOW', label: 'Baixa' },
  { value: 'UNSPECIFIED', label: 'Não definida' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function getCycleStatusLabel(status: ObjectiveCycleStatus) {
  if (status === 'ACTIVE') {
    return 'Em andamento';
  }

  if (status === 'DELAYED') {
    return 'Atrasado';
  }

  return 'Encerrado';
}

function sortCycles(cycles: ObjectiveCycleOption[]) {
  return [...cycles].sort((left, right) => {
    const leftPriority = left.cycleStatus === 'CLOSED' ? 1 : 0;
    const rightPriority = right.cycleStatus === 'CLOSED' ? 1 : 0;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return new Date(right.cycleStartDate).getTime() - new Date(left.cycleStartDate).getTime();
  });
}

function formatCycleLabel(cycle: ObjectiveCycleOption) {
  return `${cycle.name} • ${cycle.departmentName} • ${formatDate(cycle.cycleStartDate)} → ${formatDate(cycle.cycleEndDate)} • ${getCycleStatusLabel(cycle.cycleStatus)}`;
}

function getInitialState(
  cycles: ObjectiveCycleOption[],
  objective?: ObjectiveItem | null,
): FormState {
  const sortedCycles = sortCycles(cycles);
  const fallbackCycle = sortedCycles[0];
  const selectedCycle =
    sortedCycles.find((cycle) => cycle.id === objective?.cycleId) ??
    fallbackCycle ??
    null;

  return {
    name: objective?.name ?? '',
    description: objective?.description ?? '',
    priority: objective?.priority ?? 'UNSPECIFIED',
    departmentId: objective?.departmentId ?? selectedCycle?.departmentId ?? '',
    cycleId: objective?.cycleId ?? selectedCycle?.id ?? '',
  };
}

export function ObjectiveFormDialog({
  title,
  departments,
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

  const sortedCycles = useMemo(() => sortCycles(cycles), [cycles]);
  const filteredCycles = useMemo(
    () =>
      sortedCycles.filter((cycle) =>
        form.departmentId ? cycle.departmentId === form.departmentId : true,
      ),
    [form.departmentId, sortedCycles],
  );

  useEffect(() => {
    if (!filteredCycles.length) {
      if (form.cycleId) {
        setForm((current) => ({ ...current, cycleId: '' }));
      }
      return;
    }

    const selectedCycleStillVisible = filteredCycles.some((cycle) => cycle.id === form.cycleId);

    if (!selectedCycleStillVisible) {
      setForm((current) => ({
        ...current,
        cycleId: filteredCycles[0]?.id ?? '',
      }));
    }
  }, [filteredCycles, form.cycleId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      cycleId: form.cycleId,
      priority: form.priority,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
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
              disabled={departments.length <= 1}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79] disabled:cursor-not-allowed disabled:bg-[#F8FAFC]"
            >
              <option value="" disabled>
                Selecione um departamento
              </option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

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
              onChange={(event) =>
                setForm((current) => ({ ...current, cycleId: event.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              disabled={!filteredCycles.length}
            >
              {!filteredCycles.length ? (
                <option value="">Nenhum ciclo disponível para o departamento selecionado</option>
              ) : null}
              {filteredCycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id} disabled={!cycle.isCycleEditable}>
                  {formatCycleLabel(cycle)}
                  {!cycle.isCycleEditable ? ' • somente leitura' : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Prioridade</span>
            <select
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value as ObjectivePriority,
                }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            >
              {priorityOptions.map((priorityOption) => (
                <option key={priorityOption.value} value={priorityOption.value}>
                  {priorityOption.label}
                </option>
              ))}
            </select>
          </label>

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
              {loading ? 'Salvando...' : 'Salvar objetivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

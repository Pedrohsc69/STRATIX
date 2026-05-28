import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type {
  DepartmentCollaboratorOption,
  DepartmentCollaboratorItem,
  DepartmentCreatePayload,
  DepartmentDetailsItem,
  DepartmentManagerOption,
  DepartmentUpdatePayload,
} from "../types/departments.types";

type DepartmentFormModalProps = {
  mode: "create" | "edit";
  title: string;
  managers: DepartmentManagerOption[];
  collaborators: DepartmentCollaboratorOption[];
  initialDepartment?: DepartmentDetailsItem | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (
    payload: DepartmentCreatePayload | DepartmentUpdatePayload,
  ) => Promise<void>;
};

type FormState = {
  name: string;
  managerId: string;
  collaboratorIds: string[];
};

function getInitialState(department?: DepartmentDetailsItem | null): FormState {
  return {
    name: department?.name ?? "",
    managerId: department?.manager?.id ?? "",
    collaboratorIds: [],
  };
}

export function DepartmentFormModal({
  mode,
  title,
  managers,
  collaborators,
  initialDepartment,
  loading = false,
  error,
  onClose,
  onSubmit,
}: DepartmentFormModalProps) {
  const [form, setForm] = useState<FormState>(() => getInitialState(initialDepartment));

  useEffect(() => {
    setForm(getInitialState(initialDepartment));
  }, [initialDepartment]);

  const currentCollaboratorIds = useMemo(
    () => initialDepartment?.collaborators.map((collaborator) => collaborator.id) ?? [],
    [initialDepartment],
  );

  const selectableCollaborators = useMemo(() => {
    const collaboratorMap = new Map<
      string,
      (DepartmentCollaboratorOption | DepartmentCollaboratorItem) & { locked?: boolean }
    >();

    (initialDepartment?.collaborators ?? []).forEach((collaborator) => {
      collaboratorMap.set(collaborator.id, { ...collaborator, locked: true });
    });

    collaborators.forEach((collaborator) => {
      if (!collaboratorMap.has(collaborator.id)) {
        collaboratorMap.set(collaborator.id, collaborator);
      }
    });

    return Array.from(collaboratorMap.values());
  }, [collaborators, initialDepartment?.collaborators]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const collaboratorIds =
      mode === "edit"
        ? [...new Set([...currentCollaboratorIds, ...form.collaboratorIds])]
        : form.collaboratorIds;

    await onSubmit({
      name: form.name.trim(),
      managerId: form.managerId || null,
      collaboratorIds,
    });
  };

  const hasEligibleManagers = managers.length > 0;
  const hasEligibleCollaborators = selectableCollaborators.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">
              Gestão de departamentos
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
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">
              Nome do departamento
            </span>
            <input
              required
              minLength={2}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              placeholder="Ex.: Operações"
            />
          </label>

          {hasEligibleManagers ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">
                Gestor responsável
              </span>
              <select
                value={form.managerId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, managerId: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              >
                <option value="">Sem gestor atribuído</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[#6B7280]">
                Apenas gestores elegíveis e coerentes com o modelo atual são exibidos.
              </p>
            </label>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#6B7280]">
              Nenhum gestor elegível disponível agora. Crie o departamento e use o fluxo de
              convite para vincular um gestor depois.
            </div>
          )}

          {hasEligibleCollaborators ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-[#1F2937]">
                {mode === "create" ? "Selecionar colaboradores" : "Colaboradores do departamento"}
              </p>
              <p className="mt-1 text-sm text-[#6B7280]">
                {mode === "create"
                  ? "Vincule colaboradores já existentes e elegíveis ao novo departamento."
                  : "Pessoas já vinculadas permanecem selecionadas. Você também pode trazer colaboradores ativos de outros departamentos da empresa para este."}
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {selectableCollaborators.map((collaborator) => {
                  const locked = currentCollaboratorIds.includes(collaborator.id);
                  const checked = locked || form.collaboratorIds.includes(collaborator.id);

                  return (
                    <label
                      key={collaborator.id}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            collaboratorIds: event.target.checked
                              ? [...current.collaboratorIds, collaborator.id]
                              : current.collaboratorIds.filter((id) => id !== collaborator.id),
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#0F2A44] focus:ring-[#1E4E79]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#1F2937]">{collaborator.name}</p>
                          {locked ? (
                            <span className="rounded-full bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0F4C81]">
                              Atual
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[#6B7280]">{collaborator.email}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#6B7280]">
              Nenhum colaborador elegível disponível agora. O fluxo principal continua sendo
              criar o departamento e depois convidar as pessoas vinculadas a ele.
            </div>
          )}

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
              {loading ? "Salvando..." : mode === "create" ? "Criar departamento" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { SettingsSectionCard } from "./SettingsSectionCard";
import type { DeleteCompanyPayload } from "../types/settings.types";

type DangerZoneCardProps = {
  role: "DIRECTOR" | "MANAGER" | "EMPLOYEE";
  companyName: string | null;
  directorEmail: string;
  message: string | null;
  companyDeletion: {
    enabled: boolean;
    requiresPasswordConfirmation: boolean;
    requiresDirectorEmailConfirmation: boolean;
  } | null;
  onDeleteCompany: (payload: DeleteCompanyPayload) => Promise<void>;
};

function getRequestErrorMessage(requestError: unknown) {
  const maybeError = requestError as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
  };

  if (typeof maybeError.response?.data?.message === "string") {
    return maybeError.response.data.message;
  }

  if (Array.isArray(maybeError.response?.data?.message)) {
    return maybeError.response.data.message.join(", ");
  }

  return "Não foi possível excluir a empresa agora.";
}

export function DangerZoneCard({
  role,
  companyName,
  directorEmail,
  message,
  companyDeletion,
  onDeleteCompany,
}: DangerZoneCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [companyNameConfirmation, setCompanyNameConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [directorEmailConfirmation, setDirectorEmailConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDeleteCompany = role === "DIRECTOR" && companyDeletion?.enabled && companyName;
  const isCompanyNameMatching = useMemo(
    () => companyNameConfirmation.trim() === (companyName ?? ""),
    [companyName, companyNameConfirmation],
  );
  const isDirectorEmailMatching = useMemo(
    () => directorEmailConfirmation.trim().toLowerCase() === directorEmail.toLowerCase(),
    [directorEmail, directorEmailConfirmation],
  );

  const isSubmitDisabled =
    !canDeleteCompany ||
    !isCompanyNameMatching ||
    (companyDeletion?.requiresPasswordConfirmation && !currentPassword.trim()) ||
    (companyDeletion?.requiresDirectorEmailConfirmation && !isDirectorEmailMatching) ||
    submitting;

  const resetState = () => {
    setCompanyNameConfirmation("");
    setCurrentPassword("");
    setDirectorEmailConfirmation("");
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    resetState();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canDeleteCompany) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onDeleteCompany({
        companyNameConfirmation: companyNameConfirmation.trim(),
        ...(companyDeletion?.requiresPasswordConfirmation ? { currentPassword } : {}),
        ...(companyDeletion?.requiresDirectorEmailConfirmation
          ? { directorEmailConfirmation: directorEmailConfirmation.trim() }
          : {}),
      });
      resetState();
      setModalOpen(false);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError));
      setSubmitting(false);
    }
  };

  return (
    <>
      <SettingsSectionCard
        title="Zona de risco"
        subtitle="Ações irreversíveis exigem confirmação reforçada."
        action={<AlertTriangle className="h-5 w-5 text-[#D97706]" />}
      >
        {canDeleteCompany ? (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#991B1B]">Excluir empresa</p>
                <p className="mt-1 text-sm text-[#991B1B]">
                  {message ??
                    "Esta ação é irreversível e remove todos os dados vinculados à empresa."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#991B1B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7F1D1D]"
              >
                <Trash2 className="h-4 w-4" />
                Excluir empresa
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-4">
            <p className="text-sm font-medium text-[#9A3412]">Nenhuma ação crítica disponível</p>
            <p className="mt-1 text-sm text-[#9A3412]">
              {message ?? "Nenhuma ação crítica está liberada nesta área."}
            </p>
          </div>
        )}
      </SettingsSectionCard>

      {modalOpen && canDeleteCompany ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#B91C1C]">
                  Zona de risco
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">
                  Confirmar exclusão da empresa
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-gray-200 p-2 text-[#6B7280] transition-colors hover:bg-[#F8FAFC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">
                <p className="font-semibold">Esta ação é irreversível.</p>
                <p className="mt-2">
                  Todos os dados da empresa serão removidos, incluindo usuários,
                  departamentos, ciclos, objetivos, OKRs, convites e progresso.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#4B5563]">
                  Digite o nome exato da empresa para confirmar
                </span>
                <input
                  required
                  value={companyNameConfirmation}
                  onChange={(event) => setCompanyNameConfirmation(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#B91C1C]"
                  placeholder={companyName ?? ""}
                />
              </label>

              {companyDeletion?.requiresPasswordConfirmation ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#4B5563]">
                    Senha atual
                  </span>
                  <input
                    required
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#B91C1C]"
                    placeholder="Digite sua senha atual"
                  />
                </label>
              ) : null}

              {companyDeletion?.requiresDirectorEmailConfirmation ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#4B5563]">
                    Confirme o e-mail do Diretor
                  </span>
                  <input
                    required
                    type="email"
                    value={directorEmailConfirmation}
                    onChange={(event) => setDirectorEmailConfirmation(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#B91C1C]"
                    placeholder={directorEmail}
                  />
                  <p className="mt-2 text-xs text-[#6B7280]">
                    Para esta conta, a confirmação reforçada exige nome da empresa e e-mail do
                    Diretor.
                  </p>
                </label>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F8FAFC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="rounded-xl bg-[#991B1B] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7F1D1D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Excluindo..." : "Excluir empresa permanentemente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

import { useState, type FormEvent } from "react";
import { KeyRound, Link2, ShieldCheck } from "lucide-react";
import { DashboardCard } from "../../dashboard/components/DashboardCard";
import type { ChangePasswordPayload, ProfileSecurity } from "../types/profile.types";

type ChangePasswordCardProps = {
  email: string;
  security: ProfileSecurity;
  onChangePassword: (payload: ChangePasswordPayload) => Promise<void>;
  onRequestRecovery: (email: string) => Promise<void>;
};

export function ChangePasswordCard({
  email,
  security,
  onChangePassword,
  onRequestRecovery,
}: ChangePasswordCardProps) {
  const [form, setForm] = useState<ChangePasswordPayload>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const lastAccessLabel = security.lastAccessAt
    ? new Date(security.lastAccessAt).toLocaleString("pt-BR")
    : "Ainda não registrado";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (form.newPassword !== form.confirmPassword) {
      setError("A confirmação da nova senha não confere.");
      return;
    }

    try {
      setLoading(true);
      await onChangePassword(form);
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSuccessMessage("Senha alterada com sucesso.");
    } catch (requestError) {
      const maybeError = requestError as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      };

      if (typeof maybeError.response?.data?.message === "string") {
        setError(maybeError.response.data.message);
      } else if (Array.isArray(maybeError.response?.data?.message)) {
        setError(maybeError.response.data.message.join(", "));
      } else {
        setError("Não foi possível alterar a senha.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async () => {
    setError(null);
    setSuccessMessage(null);

    try {
      setRecoveryLoading(true);
      await onRequestRecovery(email);
      setSuccessMessage("Se a conta existir, um link de recuperação foi enviado para o seu e-mail.");
    } catch {
      setError("Não foi possível solicitar o link de recuperação.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <DashboardCard
      title="Segurança da conta"
      subtitle="Altere a sua senha atual ou solicite um link de recuperação seguro."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1E4E79]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1F2937]">Alterar senha</p>
              <p className="mt-1 text-sm text-[#6B7280]">
                Confirme a senha atual e defina uma nova senha segura.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Senha atual</span>
              <input
                required
                type="password"
                value={form.currentPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Nova senha</span>
              <input
                required
                type="password"
                minLength={8}
                value={form.newPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, newPassword: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Confirmar nova senha</span>
              <input
                required
                type="password"
                minLength={8}
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              />
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
              {successMessage}
            </div>
          ) : null}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={loading || !security.canChangePassword}
              className="rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Alterando..." : "Alterar senha"}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1E4E79]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1F2937]">Recuperação e acesso</p>
              <p className="mt-1 text-sm text-[#6B7280]">Último acesso registrado: {lastAccessLabel}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white p-4">
            <p className="text-sm font-medium text-[#1F2937]">Receber link de recuperação</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Enviaremos um link seguro para <strong>{email}</strong>.
            </p>
            <button
              type="button"
              onClick={handleRecovery}
              disabled={recoveryLoading || !security.recoveryAvailable}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#1F2937] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Link2 className="h-4 w-4" />
              {recoveryLoading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

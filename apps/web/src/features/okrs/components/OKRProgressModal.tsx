import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { OkrItem, OkrProgressPayload } from "../types/okrs.types";

type OKRProgressModalProps = {
  okr: OkrItem;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: OkrProgressPayload) => Promise<void>;
};

export function OKRProgressModal({
  okr,
  loading = false,
  error,
  onClose,
  onSubmit,
}: OKRProgressModalProps) {
  const [value, setValue] = useState(String(okr.currentValue));
  const [comment, setComment] = useState("");

  useEffect(() => {
    setValue(String(okr.currentValue));
    setComment("");
  }, [okr]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      value: Number(value),
      comment: comment.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">Atualizar progresso</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">{okr.name}</h2>
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
          <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
            <p className="text-sm text-[#6B7280]">Meta configurada</p>
            <p className="mt-1 text-lg font-semibold text-[#1F2937]">{okr.targetValue}</p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Novo valor atual</span>
            <input
              required
              type="number"
              min={0}
              max={okr.targetValue}
              step="0.01"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Comentário</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              placeholder="Explique o que mudou nesta atualização."
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
              {loading ? "Salvando..." : "Registrar progresso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

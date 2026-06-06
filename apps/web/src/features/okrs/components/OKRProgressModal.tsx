import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { OkrItem, OkrProgressPayload } from '../types/okrs.types';
import {
  formatOkrProgress,
  formatOkrValue,
  getMetricInputConfig,
  normalizeMetricValue,
  parseMetricInputValue,
  validateMetricValues,
} from '../utils/okr-formatters';

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
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setValue(String(okr.currentValue));
    setComment('');
    setValidationError(null);
  }, [okr]);

  const metricConfig = getMetricInputConfig(okr.metricType);
  const isReadOnly = !okr.isCycleEditable;

  const previewProgress = useMemo(() => {
    const parsedValue = parseMetricInputValue(value, okr.metricType);

    if (parsedValue === null || okr.targetValue <= 0) {
      return formatOkrProgress(okr.progress);
    }

    const normalizedValue = normalizeMetricValue(parsedValue, okr.metricType);
    const percentage = Math.min(100, Math.max(0, (normalizedValue / okr.targetValue) * 100));
    return formatOkrProgress(percentage);
  }, [okr.metricType, okr.progress, okr.targetValue, value]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedValue = parseMetricInputValue(value, okr.metricType);

    if (parsedValue === null) {
      setValidationError('Informe um valor atual válido.');
      return;
    }

    const metricValidationError = validateMetricValues({
      metricType: okr.metricType,
      currentValue: parsedValue,
      targetValue: okr.targetValue,
    });

    if (metricValidationError) {
      setValidationError(metricValidationError);
      return;
    }

    setValidationError(null);

    if (isReadOnly) {
      setValidationError('Este OKR está vinculado a um ciclo somente leitura.');
      return;
    }

    await onSubmit({
      value: normalizeMetricValue(parsedValue, okr.metricType),
      comment: comment.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
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
          {isReadOnly ? (
            <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1E3A8A]">
              Este ciclo está disponível apenas para consulta. Atualizações de progresso foram
              bloqueadas.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
              <p className="text-sm text-[#6B7280]">Valor atual</p>
              <p className="mt-1 text-lg font-semibold text-[#1F2937]">
                {formatOkrValue(okr.currentValue, okr.metricType)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
              <p className="text-sm text-[#6B7280]">Meta</p>
              <p className="mt-1 text-lg font-semibold text-[#1F2937]">
                {formatOkrValue(okr.targetValue, okr.metricType)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
              <p className="text-sm text-[#6B7280]">Progresso previsto</p>
              <p className="mt-1 text-lg font-semibold text-[#1F2937]">{previewProgress}</p>
            </div>
          </div>

          {metricConfig.isBoolean ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Novo status</span>
              <select
                value={value}
                onChange={(event) => setValue(event.target.value)}
                disabled={isReadOnly}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              >
                <option value="0">Não concluído</option>
                <option value="1">Concluído</option>
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">
                Novo valor atual
              </span>
              <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:border-[#1E4E79]">
                {metricConfig.prefix ? (
                  <span className="border-r border-gray-200 px-4 text-sm font-medium text-[#6B7280]">
                    {metricConfig.prefix}
                  </span>
                ) : null}
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={metricConfig.placeholder}
                  disabled={isReadOnly}
                  className="w-full rounded-xl bg-transparent px-4 py-3 text-sm text-[#1F2937] outline-none"
                />
                {metricConfig.suffix ? (
                  <span className="border-l border-gray-200 px-4 text-sm font-medium text-[#6B7280]">
                    {metricConfig.suffix}
                  </span>
                ) : null}
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Comentário</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              disabled={isReadOnly}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              placeholder="Explique o que mudou nesta atualização."
            />
          </label>

          {validationError || error ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {validationError ?? error}
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
              disabled={loading || isReadOnly}
              className="rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Salvando...' : 'Registrar progresso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

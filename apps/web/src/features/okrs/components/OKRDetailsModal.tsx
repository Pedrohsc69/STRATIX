import { Clock3, LoaderCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProgressIndicator } from '../../dashboard/components/ProgressIndicator';
import { OKRStatusBadge } from './OKRStatusBadge';
import { fetchOkrProgressHistory } from '../services/okrs.service';
import type { OkrItem, OkrProgressHistoryItem } from '../types/okrs.types';
import { formatOkrProgress, formatOkrValue, getMetricTypeLabel } from '../utils/okr-formatters';

type OKRDetailsModalProps = {
  okr: OkrItem;
  onClose: () => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

export function OKRDetailsModal({ okr, onClose }: OKRDetailsModalProps) {
  const [historyItems, setHistoryItems] = useState<OkrProgressHistoryItem[]>(okr.progressHistory);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(
    okr.progressHistory.length > 0 ? 1 : 0,
  );
  const [historyTotal, setHistoryTotal] = useState(okr.progressHistory.length);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        setHistoryLoading(true);
        setHistoryError(null);
        const response = await fetchOkrProgressHistory(okr.id, { page: 1, limit: 10 });

        if (!active) {
          return;
        }

        setHistoryItems(response.items);
        setHistoryPage(response.page);
        setHistoryTotalPages(response.totalPages);
        setHistoryTotal(response.total);
      } catch {
        if (!active) {
          return;
        }

        setHistoryItems(okr.progressHistory);
        setHistoryPage(1);
        setHistoryTotalPages(okr.progressHistory.length > 0 ? 1 : 0);
        setHistoryTotal(okr.progressHistory.length);
        setHistoryError(
          'Não foi possível carregar o histórico dedicado. Exibindo os dados já disponíveis.',
        );
      } finally {
        if (active) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [okr.id, okr.progressHistory]);

  const handleLoadMore = async () => {
    if (historyLoadingMore || historyPage >= historyTotalPages) {
      return;
    }

    try {
      setHistoryLoadingMore(true);
      const nextPage = historyPage + 1;
      const response = await fetchOkrProgressHistory(okr.id, { page: nextPage, limit: 10 });
      setHistoryItems((current) => [...current, ...response.items]);
      setHistoryPage(response.page);
      setHistoryTotalPages(response.totalPages);
      setHistoryTotal(response.total);
      setHistoryError(null);
    } catch {
      setHistoryError('Não foi possível carregar mais registros do histórico.');
    } finally {
      setHistoryLoadingMore(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">Detalhes do OKR</p>
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

        <div className="px-6 pt-6">
          {!okr.isCycleEditable ? (
            <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1E3A8A]">
              Este OKR pertence a um ciclo disponível apenas para consulta.
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
          <div className="min-w-0 space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Objetivo vinculado</p>
              <p className="mt-1 font-medium text-[#1F2937]">{okr.objectiveName}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Ciclo estratégico</p>
              <p className="mt-1 font-medium text-[#1F2937]">{okr.cycleName}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Departamento</p>
              <p className="mt-1 font-medium text-[#1F2937]">{okr.departmentName}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Responsável</p>
              <p className="mt-1 font-medium text-[#1F2937]">{okr.responsibleName}</p>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="flex items-center gap-3">
              <OKRStatusBadge status={okr.status} />
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Tipo de métrica</p>
              <p className="mt-1 font-medium text-[#1F2937]">
                {getMetricTypeLabel(okr.metricType)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Valor atual / meta</p>
              <p className="mt-1 font-medium text-[#1F2937]">
                {formatOkrValue(okr.currentValue, okr.metricType)} /{' '}
                {formatOkrValue(okr.targetValue, okr.metricType)}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm text-[#6B7280]">Progresso consolidado</p>
              <ProgressIndicator
                value={okr.progress}
                tone="brand"
                label={formatOkrProgress(okr.progress)}
              />
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Última atualização</p>
              <p className="mt-1 font-medium text-[#1F2937]">{formatDate(okr.lastUpdatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[#1E4E79]" />
            <p className="text-sm font-medium text-[#1F2937]">Histórico de progresso</p>
          </div>

          <div className="space-y-3">
            {historyLoading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#6B7280]">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Carregando histórico...
              </div>
            ) : historyItems.length > 0 ? (
              historyItems.map((historyItem) => (
                <div
                  key={historyItem.id}
                  className="rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-[#1F2937]">
                        Valor registrado: {formatOkrValue(historyItem.value, okr.metricType)}
                      </p>
                      <p className="mt-1 break-words text-sm text-[#6B7280]">{historyItem.comment}</p>
                    </div>
                    <p className="text-sm text-[#6B7280]">{formatDate(historyItem.date)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6B7280]">Nenhum progresso registrado até o momento.</p>
            )}

            {historyError ? (
              <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                {historyError}
              </div>
            ) : null}

            {!historyLoading && historyTotal > historyItems.length ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[#6B7280]">
                  Exibindo {historyItems.length} de {historyTotal} registros.
                </p>
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={historyLoadingMore}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-[#1E4E79] transition-colors hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {historyLoadingMore ? 'Carregando...' : 'Carregar mais'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

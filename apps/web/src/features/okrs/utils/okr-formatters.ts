import type { OkrMetricType } from "../types/okrs.types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const progressFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function getMetricTypeLabel(metricType: OkrMetricType) {
  if (metricType === "PERCENTAGE") {
    return "Percentual";
  }

  if (metricType === "CURRENCY") {
    return "Moeda";
  }

  if (metricType === "BOOLEAN") {
    return "Binário";
  }

  return "Número";
}

export function getMetricInputConfig(metricType: OkrMetricType) {
  if (metricType === "PERCENTAGE") {
    return {
      placeholder: "Ex.: 75",
      prefix: "",
      suffix: "%",
      helper: "Use valores entre 0 e 100.",
      defaultTargetValue: "100",
      defaultCurrentValue: "0",
      isBoolean: false,
    };
  }

  if (metricType === "CURRENCY") {
    return {
      placeholder: "Ex.: 50000,00",
      prefix: "R$",
      suffix: "",
      helper: "Valores monetários aceitam até 2 casas decimais.",
      defaultTargetValue: "",
      defaultCurrentValue: "0",
      isBoolean: false,
    };
  }

  if (metricType === "BOOLEAN") {
    return {
      placeholder: "",
      prefix: "",
      suffix: "",
      helper: "Use 0 para pendente e 1 para concluído.",
      defaultTargetValue: "1",
      defaultCurrentValue: "0",
      isBoolean: true,
    };
  }

  return {
    placeholder: "Ex.: 100",
    prefix: "",
    suffix: "",
    helper: "Use números inteiros ou com até 2 casas decimais.",
    defaultTargetValue: "",
    defaultCurrentValue: "0",
    isBoolean: false,
  };
}

export function parseMetricInputValue(rawValue: string, metricType: OkrMetricType) {
  if (metricType === "BOOLEAN") {
    if (rawValue === "1") {
      return 1;
    }

    if (rawValue === "0") {
      return 0;
    }

    return null;
  }

  const sanitized = rawValue
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s+/g, "");

  if (!sanitized) {
    return null;
  }

  let normalized = sanitized;

  if (sanitized.includes(",") && sanitized.includes(".")) {
    normalized = sanitized.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(sanitized)) {
    normalized = sanitized.replace(/\./g, "");
  } else if (sanitized.includes(",")) {
    normalized = sanitized.replace(",", ".");
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateMetricValues(input: {
  metricType: OkrMetricType;
  currentValue: number;
  targetValue: number;
}) {
  const currentValue =
    input.metricType === "BOOLEAN"
      ? input.currentValue
      : normalizeMetricValue(input.currentValue, input.metricType);
  const targetValue =
    input.metricType === "BOOLEAN"
      ? input.targetValue
      : normalizeMetricValue(input.targetValue, input.metricType);

  if (targetValue <= 0) {
    return "O valor meta deve ser maior que zero.";
  }

  if (currentValue < 0) {
    return "O valor atual não pode ser negativo.";
  }

  if (input.metricType === "PERCENTAGE") {
    if (targetValue > 100) {
      return "A meta percentual não pode ultrapassar 100.";
    }

    if (currentValue > 100) {
      return "O valor atual percentual não pode ultrapassar 100.";
    }
  }

  if (input.metricType === "BOOLEAN") {
    if (targetValue !== 1) {
      return "Métricas binárias exigem meta igual a 1.";
    }

    if (currentValue !== 0 && currentValue !== 1) {
      return "Métricas binárias aceitam apenas 0 ou 1.";
    }
  }

  if (currentValue > targetValue) {
    return "O valor atual não pode ser maior que a meta.";
  }

  return null;
}

export function normalizeMetricValue(value: number, metricType: OkrMetricType) {
  if (!Number.isFinite(value)) {
    return value;
  }

  if (metricType === "BOOLEAN") {
    return value === 1 ? 1 : 0;
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatOkrValue(value: number, metricType: OkrMetricType) {
  if (metricType === "BOOLEAN") {
    return value >= 1 ? "Concluído" : "Pendente";
  }

  if (metricType === "CURRENCY") {
    return currencyFormatter.format(value);
  }

  const formatted = numberFormatter.format(value);
  return metricType === "PERCENTAGE" ? `${formatted}%` : formatted;
}

export function formatOkrProgress(progress: number) {
  return `${progressFormatter.format(progress)}%`;
}

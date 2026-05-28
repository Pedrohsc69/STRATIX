import { BadRequestException } from '@nestjs/common';
import { OKRMetricType } from '@prisma/client';

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function ensureFinite(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new BadRequestException(`${label} must be a valid number`);
  }
}

function ensureNonNegative(value: number, label: string) {
  if (value < 0) {
    throw new BadRequestException(`${label} cannot be negative`);
  }
}

export function normalizeOkrValue(value: number, metricType: OKRMetricType) {
  ensureFinite(value, 'Value');

  if (metricType === OKRMetricType.BOOLEAN) {
    if (value !== 0 && value !== 1) {
      throw new BadRequestException('Boolean metrics only accept 0 or 1');
    }

    return value;
  }

  ensureNonNegative(value, 'Value');

  if (metricType === OKRMetricType.CURRENCY) {
    return roundTo(value, 2);
  }

  if (metricType === OKRMetricType.PERCENTAGE) {
    return roundTo(value, 2);
  }

  return roundTo(value, 2);
}

export function validateOkrValues(input: {
  metricType: OKRMetricType;
  currentValue: number;
  targetValue: number;
}) {
  const currentValue = normalizeOkrValue(input.currentValue, input.metricType);
  const targetValue = normalizeOkrValue(input.targetValue, input.metricType);

  if (targetValue <= 0) {
    throw new BadRequestException('Target value must be greater than zero');
  }

  if (currentValue < 0) {
    throw new BadRequestException('Current value cannot be negative');
  }

  if (input.metricType === OKRMetricType.PERCENTAGE) {
    if (targetValue > 100) {
      throw new BadRequestException('Percentage target value cannot exceed 100');
    }

    if (currentValue > 100) {
      throw new BadRequestException('Percentage current value cannot exceed 100');
    }
  }

  if (input.metricType === OKRMetricType.BOOLEAN) {
    if (targetValue !== 1) {
      throw new BadRequestException('Boolean target value must be 1');
    }
  }

  if (currentValue > targetValue) {
    throw new BadRequestException('Current value cannot exceed the target value');
  }

  return {
    currentValue,
    targetValue,
  };
}

export function normalizeOkrProgress(progress: number) {
  if (!Number.isFinite(progress) || progress <= 0) {
    return 0;
  }

  return Math.min(100, roundTo(progress, 1));
}

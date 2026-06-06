import { ForbiddenException } from '@nestjs/common';
import { CycleStatus } from '@prisma/client';

type CycleEditabilityInput = {
  status: CycleStatus;
  endDate: Date;
};

export function isCycleClosed(cycle: Pick<CycleEditabilityInput, 'status'>) {
  return cycle.status === CycleStatus.CLOSED;
}

export function isCycleEditable(cycle: CycleEditabilityInput) {
  return !isCycleClosed(cycle) && cycle.endDate.getTime() >= Date.now();
}

export function assertCycleIsEditable(
  cycle: CycleEditabilityInput,
  message = 'Strategic cycle is not editable',
) {
  if (!isCycleEditable(cycle)) {
    throw new ForbiddenException(message);
  }
}

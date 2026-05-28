import type { UserRole } from '@prisma/client';

export type InviteViewStatus = 'PENDING' | 'EXPIRED';

export type InviteResponseItem = {
  id: string;
  email: string;
  role: UserRole;
  department: {
    id: string;
    name: string;
  } | null;
  status: InviteViewStatus;
  expiresAt: string;
  createdAt: string;
};

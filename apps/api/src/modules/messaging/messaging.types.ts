import type { UserRole } from '@prisma/client';

export type InviteEmailPayload = {
  inviteId: string;
  email: string;
  role: UserRole;
  companyName: string;
  departmentName: string | null;
  inviteUrl: string;
  createdAt: string;
};

import type { UserRole, UserStatus } from '@prisma/client';

export type AuthenticatedUser = {
  sub: string;
  email: string;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    isActive: boolean;
    companyId: string | null;
    departmentId: string | null;
  };
};

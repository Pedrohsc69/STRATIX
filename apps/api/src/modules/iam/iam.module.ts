import { createFeatureModule, createReadModelController } from '../shared/module-factory';

const IamController = createReadModelController('iam', 'iam');

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly role: 'Diretor' | 'Gestor' | 'Colaborador',
  ) {}
}

export class Email {
  constructor(public readonly value: string) {}
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
}

export class PasswordPolicyService {
  isStrong(password: string) {
    return password.length >= 8;
  }
}

export interface SignInDto {
  email: string;
  password: string;
}

export class SignInUseCase {
  execute(input: SignInDto) {
    return {
      message: 'JWT auth structure prepared',
      email: input.email,
    };
  }
}

export const IamModule = createFeatureModule(IamController);

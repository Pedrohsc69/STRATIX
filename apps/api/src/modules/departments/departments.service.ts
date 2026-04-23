import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/shared/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actor: AuthenticatedUser, input: CreateDepartmentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: { id: true, companyId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.companyId) {
      throw new BadRequestException('Company must be created first');
    }

    const existingDepartment = await this.prisma.department.findFirst({
      where: {
        companyId: user.companyId,
        name: input.name.trim(),
      },
    });

    if (existingDepartment) {
      throw new ConflictException('Department already exists');
    }

    return this.prisma.department.create({
      data: {
        name: input.name.trim(),
        companyId: user.companyId,
      },
    });
  }
}

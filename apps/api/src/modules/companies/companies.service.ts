import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/shared/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actor: AuthenticatedUser, input: CreateCompanyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.companyId) {
      throw new BadRequestException('Company already configured');
    }

    const cnpj = input.cnpj.replace(/\D/g, '');
    const existingCompany = await this.prisma.company.findUnique({
      where: { cnpj },
    });

    if (existingCompany) {
      throw new ConflictException('Unable to create company');
    }

    const company = await this.prisma.$transaction(async (tx) => {
      const createdCompany = await tx.company.create({
        data: {
          name: input.name.trim(),
          cnpj,
          businessArea: input.businessArea.trim(),
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { companyId: createdCompany.id },
      });

      return createdCompany;
    });

    return company;
  }
}

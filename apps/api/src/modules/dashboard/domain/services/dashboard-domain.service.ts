import { Injectable } from '@nestjs/common';
import { DashboardCard } from '../entities/dashboard-card.entity';

@Injectable()
export class DashboardDomainService {
  sortByPriority(cards: DashboardCard[]) {
    return cards;
  }
}

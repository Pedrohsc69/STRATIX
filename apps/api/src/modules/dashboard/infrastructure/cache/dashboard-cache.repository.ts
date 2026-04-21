import { Injectable } from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DashboardCard } from '../../domain/entities/dashboard-card.entity';
import { DashboardCacheRepository } from '../../domain/repositories/dashboard-cache.repository';

@Schema({
  collection: 'dashboard_cache',
  versionKey: false,
})
export class DashboardCacheDocument {
  @Prop({ required: true, unique: true })
  companyId!: string;

  @Prop({ required: true, type: [{ label: String, value: Number }] })
  cards!: Array<{ label: string; value: number }>;

  @Prop({ required: true })
  computedAt!: Date;

  @Prop({ required: true, expires: 0 })
  expiresAt!: Date;
}

export const DashboardCacheSchema = SchemaFactory.createForClass(DashboardCacheDocument);

@Injectable()
export class MongoDashboardCacheRepository implements DashboardCacheRepository {
  constructor(
    @InjectModel(DashboardCacheDocument.name)
    private readonly dashboardCacheModel: Model<DashboardCacheDocument>,
  ) {}

  async saveSummary(companyId: string, cards: DashboardCard[]) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    await this.dashboardCacheModel.findOneAndUpdate(
      { companyId },
      {
        companyId,
        cards: cards.map((card) => ({ label: card.label, value: card.value })),
        computedAt: now,
        expiresAt,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  async getSummary(companyId: string) {
    const cachedDashboard = await this.dashboardCacheModel.findOne({ companyId }).lean();

    if (!cachedDashboard) {
      return null;
    }

    return cachedDashboard.cards.map((card) => new DashboardCard(card.label, card.value));
  }
}

export class DashboardCard {
  constructor(
    public readonly label: string,
    public readonly value: number,
  ) {}
}

export class DashboardFilter {
  constructor(public readonly companyId: string) {}
}

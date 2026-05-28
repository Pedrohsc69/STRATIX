import { IsIn } from 'class-validator';

export class ReportFormatDto {
  @IsIn(['csv', 'pdf'])
  format!: 'csv' | 'pdf';
}

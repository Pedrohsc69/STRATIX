export type PdfTextAlign = 'left' | 'center' | 'right';

export type PdfReportSummaryItem = {
  label: string;
  value: string;
};

export type PdfReportTableColumn = {
  label: string;
  width?: number;
  align?: PdfTextAlign;
};

export type PdfReportTable = {
  columns: PdfReportTableColumn[];
  rows: string[][];
  emptyMessage?: string;
};

export type PdfReportDefinition = {
  reportTitle: string;
  companyName: string;
  generatedAt: Date;
  summary: PdfReportSummaryItem[];
  table: PdfReportTable;
};

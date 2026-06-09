import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PdfReportDefinition, PdfReportTableColumn } from './pdf-types';

const COLORS = {
  primary: '#0F2A44',
  secondary: '#1E4E79',
  accent: '#2BB3A3',
  text: '#1F2937',
  muted: '#6B7280',
  line: '#D1D5DB',
  soft: '#F3F4F6',
  white: '#FFFFFF',
} as const;

const FOOTER_HEIGHT = 34;
const TABLE_ROW_PADDING = 7;

@Injectable()
export class PdfLayoutService {
  render(doc: PDFKit.PDFDocument, report: PdfReportDefinition) {
    let currentY = this.drawHeader(doc, report);
    currentY = this.drawSummary(doc, report, currentY + 18);
    this.drawTable(doc, report, currentY + 24);
    this.drawFooters(doc);
  }

  private drawHeader(doc: PDFKit.PDFDocument, report: PdfReportDefinition) {
    const left = doc.page.margins.left;
    const top = doc.page.margins.top;
    const contentWidth = this.getContentWidth(doc);
    let currentY = top;

    const logoHeight = 28;
    const logoPath = this.resolveLogoPath();

    if (logoPath) {
      try {
        doc.image(logoPath, left, currentY, {
          fit: [118, logoHeight],
        });
      } catch {
        this.drawLogoFallback(doc, left, currentY);
      }
    } else {
      this.drawLogoFallback(doc, left, currentY);
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(COLORS.primary)
      .text('STRATIX', left + 132, currentY + 2);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text('Plataforma de Planejamento Estratégico', left + 132, currentY + 17);

    currentY += 46;

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(COLORS.primary)
      .text(report.reportTitle, left, currentY, {
        width: contentWidth,
      });

    currentY += 28;

    const metadata = [
      `Empresa: ${report.companyName}`,
      `Gerado em: ${this.formatDateTime(report.generatedAt)}`,
    ];

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.text)
      .text(metadata.join('  |  '), left, currentY, {
        width: contentWidth,
      });

    currentY += 24;

    doc
      .moveTo(left, currentY)
      .lineTo(left + contentWidth, currentY)
      .lineWidth(1)
      .strokeColor(COLORS.accent)
      .stroke();

    return currentY + 18;
  }

  private drawSummary(
    doc: PDFKit.PDFDocument,
    report: PdfReportDefinition,
    startY: number,
  ) {
    const left = doc.page.margins.left;
    const contentWidth = this.getContentWidth(doc);
    const gap = 12;
    const cardWidth = (contentWidth - gap) / 2;
    const cardHeight = 54;
    let currentY = startY;

    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(COLORS.primary)
      .text('Resumo executivo', left, currentY);

    currentY += 24;

    for (let index = 0; index < report.summary.length; index += 2) {
      currentY = this.ensureSpace(doc, currentY, cardHeight + 8);
      const rowItems = report.summary.slice(index, index + 2);

      rowItems.forEach((item, itemIndex) => {
        const x = left + itemIndex * (cardWidth + gap);
        this.drawSummaryCard(doc, x, currentY, cardWidth, cardHeight, item.label, item.value);
      });

      currentY += cardHeight + 10;
    }

    return currentY;
  }

  private drawSummaryCard(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: string,
  ) {
    doc
      .roundedRect(x, y, width, height, 8)
      .fillAndStroke(COLORS.soft, COLORS.line);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(label, x + 14, y + 10, {
        width: width - 28,
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor(COLORS.primary)
      .text(value, x + 14, y + 26, {
        width: width - 28,
      });
  }

  private drawTable(
    doc: PDFKit.PDFDocument,
    report: PdfReportDefinition,
    startY: number,
  ) {
    const left = doc.page.margins.left;
    let currentY = startY;

    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(COLORS.primary)
      .text('Detalhamento', left, currentY);

    currentY += 24;

    const columnWidths = this.resolveColumnWidths(doc, report.table.columns);
    currentY = this.drawTableHeader(doc, report.table.columns, columnWidths, currentY);

    if (report.table.rows.length === 0) {
      const emptyHeight = 34;
      currentY = this.ensureSpace(doc, currentY, emptyHeight + 8, () => {
        const headerY = this.drawHeader(doc, report);
        return this.drawTableHeader(doc, report.table.columns, columnWidths, headerY);
      });

      doc
        .rect(left, currentY, columnWidths.reduce((sum, value) => sum + value, 0), emptyHeight)
        .fillAndStroke(COLORS.white, COLORS.line);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text(report.table.emptyMessage ?? 'Nenhum dado disponível.', left + 12, currentY + 10, {
          width: columnWidths.reduce((sum, value) => sum + value, 0) - 24,
        });
      return;
    }

    for (const row of report.table.rows) {
      const rowHeight = this.measureRowHeight(doc, row, columnWidths);
      currentY = this.ensureSpace(doc, currentY, rowHeight + 4, () => {
        const headerY = this.drawHeader(doc, report);
        return this.drawTableHeader(doc, report.table.columns, columnWidths, headerY);
      });
      currentY = this.drawTableRow(doc, row, columnWidths, currentY);
    }
  }

  private drawTableHeader(
    doc: PDFKit.PDFDocument,
    columns: PdfReportTableColumn[],
    columnWidths: number[],
    y: number,
  ) {
    const left = doc.page.margins.left;
    const height = 26;
    let currentX = left;

    columns.forEach((column, index) => {
      const width = columnWidths[index] ?? 0;
      doc.rect(currentX, y, width, height).fillAndStroke(COLORS.secondary, COLORS.secondary);
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(COLORS.white)
        .text(column.label, currentX + 8, y + 8, {
          width: width - 16,
          align: column.align ?? 'left',
        });
      currentX += width;
    });

    return y + height;
  }

  private drawTableRow(
    doc: PDFKit.PDFDocument,
    row: string[],
    columnWidths: number[],
    y: number,
  ) {
    const left = doc.page.margins.left;
    const height = this.measureRowHeight(doc, row, columnWidths);
    let currentX = left;

    row.forEach((cell, index) => {
      const width = columnWidths[index] ?? 0;
      doc.rect(currentX, y, width, height).fillAndStroke(COLORS.white, COLORS.line);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLORS.text)
        .text(cell, currentX + 8, y + TABLE_ROW_PADDING, {
          width: width - 16,
        });
      currentX += width;
    });

    return y + height;
  }

  private measureRowHeight(doc: PDFKit.PDFDocument, row: string[], columnWidths: number[]) {
    const contentHeights = row.map((cell, index) =>
      doc.heightOfString(cell, {
        width: (columnWidths[index] ?? 0) - 16,
      }),
    );

    return Math.max(...contentHeights, 12) + TABLE_ROW_PADDING * 2;
  }

  private resolveColumnWidths(doc: PDFKit.PDFDocument, columns: PdfReportTableColumn[]) {
    const contentWidth = this.getContentWidth(doc);
    const definedWidth = columns.reduce((sum, column) => sum + (column.width ?? 0), 0);
    const flexibleColumns = columns.filter((column) => !column.width).length;
    const flexibleWidth = flexibleColumns > 0 ? (contentWidth - definedWidth) / flexibleColumns : 0;

    return columns.map((column) => column.width ?? flexibleWidth);
  }

  private drawFooters(doc: PDFKit.PDFDocument) {
    const range = doc.bufferedPageRange();

    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(range.start + index);
      const left = doc.page.margins.left;
      const y = doc.page.height - doc.page.margins.bottom + 8;
      const contentWidth = this.getContentWidth(doc);

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text('Gerado automaticamente pelo STRATIX', left, y, {
          width: contentWidth / 2,
        });

      doc.text(`Página ${index + 1} de ${range.count}`, left + contentWidth / 2, y, {
        width: contentWidth / 2,
        align: 'right',
      });
    }
  }

  private ensureSpace(
    doc: PDFKit.PDFDocument,
    currentY: number,
    requiredHeight: number,
    onAddPage?: () => number,
  ) {
    const bottomLimit = doc.page.height - doc.page.margins.bottom - FOOTER_HEIGHT;

    if (currentY + requiredHeight <= bottomLimit) {
      return currentY;
    }

    doc.addPage();
    if (onAddPage) {
      return onAddPage();
    }

    return doc.page.margins.top;
  }

  private getContentWidth(doc: PDFKit.PDFDocument) {
    return doc.page.width - doc.page.margins.left - doc.page.margins.right;
  }

  private drawLogoFallback(doc: PDFKit.PDFDocument, x: number, y: number) {
    doc
      .roundedRect(x, y, 118, 28, 6)
      .fill(COLORS.primary);

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(COLORS.white)
      .text('STRATIX', x, y + 7, {
        width: 118,
        align: 'center',
      });
  }

  private formatDateTime(value: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(value);
  }

  private resolveLogoPath() {
    const candidates = [
      resolve(process.cwd(), '../web/src/shared/assets/logos/originals/logo-main.png'),
      resolve(process.cwd(), 'apps/web/src/shared/assets/logos/originals/logo-main.png'),
      resolve(__dirname, '../../../../../web/src/shared/assets/logos/originals/logo-main.png'),
    ];

    return candidates.find((candidate) => existsSync(candidate)) ?? null;
  }
}

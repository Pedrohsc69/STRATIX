import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PdfLayoutService } from './pdf-layout.service';
import type { PdfReportDefinition } from './pdf-types';

@Injectable()
export class PdfReportService {
  constructor(private readonly pdfLayoutService: PdfLayoutService) {}

  async generate(report: PdfReportDefinition): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const document = new PDFDocument({
        size: 'A4',
        margin: 48,
        bufferPages: true,
        compress: false,
      });

      document.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      document.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      document.on('error', reject);

      this.pdfLayoutService.render(document, report);
      document.end();
    });
  }
}

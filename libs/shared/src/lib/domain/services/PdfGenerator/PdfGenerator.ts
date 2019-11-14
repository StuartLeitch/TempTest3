import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import {format} from 'date-fns';
import ejs from 'ejs';
import pdf from 'html-pdf';
import {Invoice, Author, Article, Payer} from '@hindawi/shared';

export interface InvoicePayload {
  invoice: Invoice;
  author: Author;
  article: Article;
  payer: Payer;
}

export class PdfGeneratorService {
  private templates: {
    [key: string]: {
      fileName: string;
      compile?: ejs.TemplateFunction;
    };
  } = {};

  public getInvoice(payload: InvoicePayload): Promise<Readable> {
    return new Promise((resolve, reject) => {
      const template = this.getTemplate('invoice');
      const html = template({
        dateFormatFn: format,
        ...payload
      });

      const pdfOptions: pdf.CreateOptions = {
        border: {
          left: '1cm',
          right: '1cm',
          bottom: '0.75cm',
          top: '0.25cm'
        },
        format: 'A4',
        footer: {
          height: '2cm'
        },
        header: {
          height: '2.5cm'
        }
      };

      pdf.create(html, pdfOptions).toStream((err, stream) => {
        if (err) {
          return reject(err);
        }

        resolve(stream);
      });
    });
  }

  public addTemplate(name: string, fileName: string): PdfGeneratorService {
    this.templates[name] = {fileName};
    return this;
  }

  private getTemplate(name: string): ejs.TemplateFunction {
    if (!(name in this.templates)) {
      return () => '';
    }

    const template = this.templates[name];

    const file = path.join(__dirname, 'templates/', template.fileName);

    const templateStr = fs.readFileSync(file, 'utf8');

    if (!template.compile) {
      template.compile = ejs.compile(templateStr);
    }

    return template.compile;
  }
}

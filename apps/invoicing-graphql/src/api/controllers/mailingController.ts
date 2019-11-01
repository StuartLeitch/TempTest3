import {JsonController, Post} from 'routing-controllers';

import {environment} from '../../environments/environment';
import {Emailer} from '../../../../../libs/shared/src/lib/infrastructure/communication-channels';

@JsonController('/mail')
export class MailController {
  @Post()
  public sendDummyMail() {
    const mailer = new Emailer();
    return mailer
      .createTemplate({
        type: 'user',
        fromEmail: environment.mailing.fromEmail,
        toUser: {
          email: environment.mailing.toEmail,
          name: `Some Guy In A Suit`
        },
        content: {
          ctaText: 'PAY INVOICE',
          signatureJournal: 'Finance & Bubblegum',
          signatureName: `Hindawi Finance`,
          subject: `Invoice #123 emitted`,
          paragraph:
            'Please visit Phenom Invoice and pay the attached invoice.',
          unsubscribeLink: `http://www.google.com`,
          ctaLink: `http://localhost:4200/payment/invoice-1/payer`
        },
        bodyProps: {
          hasLink: true,
          hasIntro: true,
          hasSignature: true
        }
      })
      .sendEmail();
  }
}

import SMTPTransport from "nodemailer/lib/smtp-transport";
import { mailer } from "./mailer";

type SendEmailProps = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailProps): Promise<SMTPTransport.SentMessageInfo> {
  const response = await mailer.sendMail({
    from: `"LUDOV - réservation" <support@dukelon.com>`,
    to,
    subject,
    text,
    html,
  });
  return response;
}

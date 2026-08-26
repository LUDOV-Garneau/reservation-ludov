import SMTPTransport from "nodemailer/lib/smtp-transport";
import { mailer } from "./mailer";
import { parseYmdLocal } from "./dates";
import {
  getTemplate,
  renderZoneText,
  zoneToParagraphs,
  zoneToListItems,
} from "./emailTemplates";

const dateLocaleFor = (locale?: string | null) =>
  locale === "en" ? "en-CA" : "fr-CA";

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
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
  return response;
}

export async function sendResetPasswordEmail({
  to,
  locale,
}: {
  to: string;
  locale?: string | null;
}): Promise<SMTPTransport.SentMessageInfo> {
  const template = await getTemplate("reset_password", locale);
  const subject = template.subject;
  const introHtml = zoneToParagraphs(
    renderZoneText(template.zones.intro ?? "", {}),
  );
  const outroHtml = zoneToParagraphs(
    renderZoneText(template.zones.outro ?? "", {}),
    "margin: 0; color: #6b7280; font-size: 14px;",
  );

  const html = `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #00b8db 0%, #0092b8 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                  LUDOV
                </h1>
                <p style="margin: 10px 0 0 0; color: #cefafe; font-size: 16px;">
                  Réinitialisation du mot de passe
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                ${introHtml}

                ${outroHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">
                  À bientôt chez LUDOV !
                </p>
                <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                  L'équipe LUDOV
                </p>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} LUDOV. Tous droits réservés.
                  </p>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const response = await sendEmail({
    to,
    subject,
    html,
  });

  return response;
}

export async function sendWelcomeEmail({
  to,
  locale,
}: {
  to: string;
  locale?: string | null;
}): Promise<SMTPTransport.SentMessageInfo> {
  const template = await getTemplate("welcome", locale);
  const subject = template.subject;
  const introHtml = zoneToParagraphs(
    renderZoneText(template.zones.intro ?? "", {}),
  );
  const outroHtml = zoneToParagraphs(
    renderZoneText(template.zones.outro ?? "", {}),
    "margin: 0 0 30px 0; color: #374151; font-size: 16px;",
  );

  const html = `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #00b8db 0%, #0092b8 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                  LUDOV
                </h1>
                <p style="margin: 10px 0 0 0; color: #cefafe; font-size: 16px;">
                  Confirmation d'inscription
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                ${introHtml}

                ${outroHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                  L'équipe LUDOV
                </p>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} LUDOV. Tous droits réservés.
                  </p>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const response = await sendEmail({
    to,
    subject,
    html,
  });

  return response;
}

export async function sendReminderEmail({
  to,
  userName,
  reservationId,
  date,
  time,
  consoleName,
  locale,
}: {
  to: string;
  userName: string;
  reservationId: string;
  date: string;
  time: string;
  consoleName: string;
  locale?: string | null;
}): Promise<SMTPTransport.SentMessageInfo> {
  const formattedDate = parseYmdLocal(date).toLocaleDateString(
    dateLocaleFor(locale),
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const template = await getTemplate("reminder", locale);
  const subject = template.subject;
  const variables = {
    userName,
    reservationId,
    date: formattedDate,
    time,
    consoleName,
  };
  const introHtml = zoneToParagraphs(
    renderZoneText(template.zones.intro ?? "", variables),
  );
  const outroHtml = zoneToParagraphs(
    renderZoneText(template.zones.outro ?? "", variables),
    "margin: 0; color: #6b7280; font-size: 14px;",
  );

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rappel de réservation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #00b8db 0%, #0092b8 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    LUDOV
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #cefafe; font-size: 16px;">
                    Rappel de réservation
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${introHtml}

                  <!-- Details Card -->
                  <table role="presentation" style="width: 100%; background-color: #ecfeff; border: 2px solid #00b8db; border-radius: 12px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 24px;">
                        <h2 style="margin: 0 0 20px 0; color: #0092b8; font-size: 18px;">
                          Détails de votre réservation
                        </h2>

                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #cefafe;">
                              <strong style="color: #00b8db;">Numéro :</strong> 
                              <span style="color: #104e64;">${reservationId}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #cefafe;">
                              <strong style="color: #00b8db;">Date :</strong> 
                              <span style="color: #104e64;">${formattedDate}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #cefafe;">
                              <strong style="color: #00b8db;">Heure :</strong> 
                              <span style="color: #104e64;">${time}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #cefafe;">
                              <strong style="color: #00b8db;">Console :</strong> 
                              <span style="color: #104e64;">${consoleName}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; background-color:#fef3c7; border:2px solid #f59e0b; border-radius:12px; margin-bottom:30px;">
                    <tr>
                      <td style="padding:20px;">
                        <p style="margin:0 0 10px 0; color:#92400e; font-size:15px; font-weight:600;">
                          <strong>Informations utiles:</strong>
                        </p>
                        <ul style="margin:0; padding-left:20px; color:#92400e; font-size:15px; line-height:1.5;">
                          <li style="margin:0 0 6px 0;">
                            N'oubliez pas d'apporter une pièce d'identité valide lors de votre réservation (permis de conduire, carte étudiante, etc.).
                          </li>
                          <li style="margin:0;">
                            Nous vous encourageons à apporter votre propre casque d'écoute, si possible, afin de profiter pleinement de votre réservation.
                          </li>
                        </ul>
                      </td>
                    </tr>
                  </table>

                  ${outroHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">
                    À bientôt chez LUDOV !
                  </p>
                  <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                    L'équipe LUDOV
                  </p>
                  
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                    <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                      Cet email est un rappel automatique de votre réservation.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} LUDOV. Tous droits réservés.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const response = await sendEmail({
    to,
    subject,
    html,
  });

  return response;
}

export async function sendConfirmationEmail({
  to,
  userName,
  reservationId,
  date,
  time,
  consoleName,
  locale,
}: {
  to: string;
  userName: string;
  reservationId: string;
  date: string;
  time: string;
  consoleName: string;
  locale?: string | null;
}): Promise<SMTPTransport.SentMessageInfo> {
  const formattedDate = parseYmdLocal(date).toLocaleDateString(
    dateLocaleFor(locale),
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const template = await getTemplate("confirmation", locale);
  const subject = template.subject;
  const variables = {
    userName,
    reservationId,
    date: formattedDate,
    time,
    consoleName,
  };
  const introHtml = zoneToParagraphs(
    renderZoneText(template.zones.intro ?? "", variables),
  );
  const importantItems = zoneToListItems(
    renderZoneText(template.zones.important ?? "", variables),
  );
  const outroHtml = zoneToParagraphs(
    renderZoneText(template.zones.outro ?? "", variables),
    "margin: 0; color: #6b7280; font-size: 14px;",
  );

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Confirmation de réservation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #00b8db 0%, #0092b8 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    LUDOV
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #cefafe; font-size: 16px;">
                    Confirmation de réservation
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${introHtml}

                  <!-- Details Card -->
                  <table role="presentation" style="width: 100%; background-color: #ecfeff; border: 2px solid #00b8db; border-radius: 12px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 24px;">
                        <h2 style="margin: 0 0 20px 0; color: #0092b8; font-size: 18px;">
                          Détails de votre réservation
                        </h2>

                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #cefafe;">
                              <strong style="color: #00b8db;">Numéro :</strong>
                              <span style="color: #104e64;">${reservationId}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #cefafe;">
                              <strong style="color: #00b8db;">Date :</strong>
                              <span style="color: #104e64;">${formattedDate}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #cefafe;">
                              <strong style="color: #00b8db;">Heure :</strong>
                              <span style="color: #104e64;">${time}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0;">
                              <strong style="color: #00b8db;">Console :</strong>
                              <span style="color: #104e64;">${consoleName}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Info Box -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; background-color:#fef3c7; border:2px solid #f59e0b; border-radius:12px; margin-bottom:30px;">
                    <tr>
                      <td style="padding:20px;">
                        <p style="margin:0 0 10px 0; color:#92400e; font-size:15px; font-weight:600;">
                          <strong>Informations importantes :</strong>
                        </p>
                        <ul style="margin:0; padding-left:20px; color:#92400e; font-size:15px; line-height:1.5;">
                          ${importantItems}
                        </ul>
                      </td>
                    </tr>
                  </table>

                  ${outroHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">
                    Merci pour votre confiance et à bientôt chez LUDOV !
                  </p>
                  <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                    L'équipe LUDOV
                  </p>
                  
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                    <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                      Cet email confirme votre réservation.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} LUDOV. Tous droits réservés.
                    </p>
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function sendCancellationEmail({
  to,
  userName,
  reservationId,
  date,
  time,
  reason,
  locale,
}: {
  to: string;
  userName: string;
  reservationId: string;
  date: string;
  time: string;
  reason: string;
  locale?: string | null;
}): Promise<SMTPTransport.SentMessageInfo> {
  const formattedDate = parseYmdLocal(date).toLocaleDateString(
    dateLocaleFor(locale),
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const template = await getTemplate("cancellation", locale);
  const subject = template.subject;
  const variables = {
    userName,
    reservationId,
    date: formattedDate,
    time,
    reason,
  };
  const introHtml = zoneToParagraphs(
    renderZoneText(template.zones.intro ?? "", variables),
  );
  const outroHtml = zoneToParagraphs(
    renderZoneText(template.zones.outro ?? "", variables),
    "margin: 0 0 20px 0; color: #374151; font-size: 16px;",
  );

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Annulation de réservation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    LUDOV
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #fee2e2; font-size: 16px;">
                    Annulation de réservation
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${introHtml}

                  <!-- Details Card -->
                  <table role="presentation" style="width: 100%; background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 24px;">
                        <h2 style="margin: 0 0 20px 0; color: #b91c1c; font-size: 18px;">
                          Réservation annulée
                        </h2>

                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                              <strong style="color: #991b1b;">Numéro :</strong>
                              <span style="color: #7f1d1d;">${reservationId}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                              <strong style="color: #991b1b;">Date :</strong>
                              <span style="color: #7f1d1d;">${formattedDate}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                              <strong style="color: #991b1b;">Heure :</strong>
                              <span style="color: #7f1d1d;">${time}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0;">
                              <strong style="color: #991b1b;">Raison de l'annulation :</strong>
                              <span style="color: #7f1d1d;">${escapeHtml(reason)}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${outroHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">
                    Merci pour votre compréhension.
                  </p>
                  <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                    L'équipe LUDOV
                  </p>

                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                    <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                      Cet email confirme l'annulation de votre réservation.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} LUDOV. Tous droits réservés.
                    </p>
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
}

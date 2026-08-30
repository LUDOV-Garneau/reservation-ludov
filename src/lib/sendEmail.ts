import SMTPTransport from "nodemailer/lib/smtp-transport";
import { mailer } from "./mailer";
import { parseYmdLocal } from "./dates";
import {
  escapeHtml,
  getTemplate,
  renderZoneText,
  renderZoneTextPlain,
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

/**
 * Courriel du parcours « mot de passe oublié » : contient le lien à usage
 * unique vers /auth/reset-password.
 *
 * Le texte est éditable dans l'admin (gabarit `forgot_password`) ; le bouton,
 * l'URL et l'encadré de sécurité restent dans le gabarit HTML fixe, pour
 * qu'aucune édition ne puisse casser ou détourner le lien.
 *
 * Contraintes propres au courriel : tables imbriquées plutôt que flexbox,
 * styles en ligne, bouton « bulletproof » doublé en VML pour Outlook, et
 * préen-tête masqué qui sert d'aperçu dans la liste des messages.
 */
export async function sendForgotPasswordEmail({
  to,
  locale,
  resetUrl,
  expiresInMinutes,
}: {
  to: string;
  locale?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
}): Promise<SMTPTransport.SentMessageInfo> {
  const template = await getTemplate("forgot_password", locale);
  const subject = template.subject;
  const isEn = locale === "en";

  const copy = isEn
    ? {
        lang: "en",
        headerSubtitle: "Password reset",
        preheader: `Your password reset link — valid for ${expiresInMinutes} minutes.`,
        button: "Choose a new password",
        expiry: `This link expires in ${expiresInMinutes} minutes and can only be used once.`,
        fallbackTitle: "Button not working?",
        fallbackHint: "Copy this address into your browser:",
        securityTitle: "You did not request this?",
        securityBody:
          "Ignore this email — your current password stays valid and no change has been made. Resetting only happens after someone opens this link and chooses a new password.",
        footerLead: "See you soon at LUDOV!",
        footerTeam: "The LUDOV team",
        footerNote: "This email was sent automatically, please do not reply.",
        rights: "All rights reserved.",
      }
    : {
        lang: "fr",
        headerSubtitle: "Réinitialisation du mot de passe",
        preheader: `Votre lien de réinitialisation — valide ${expiresInMinutes} minutes.`,
        button: "Choisir un nouveau mot de passe",
        expiry: `Ce lien expire dans ${expiresInMinutes} minutes et ne peut servir qu'une seule fois.`,
        fallbackTitle: "Le bouton ne fonctionne pas ?",
        fallbackHint: "Copiez cette adresse dans votre navigateur :",
        securityTitle: "Vous n'êtes pas à l'origine de cette demande ?",
        securityBody:
          "Ignorez ce courriel : votre mot de passe actuel reste valide et rien n'a été modifié. La réinitialisation n'a lieu qu'une fois ce lien ouvert et un nouveau mot de passe choisi.",
        footerLead: "À bientôt chez LUDOV !",
        footerTeam: "L'équipe LUDOV",
        footerNote: "Ce courriel est envoyé automatiquement, merci de ne pas y répondre.",
        rights: "Tous droits réservés.",
      };

  const variables = { expiresInMinutes: String(expiresInMinutes) };
  const introHtml = zoneToParagraphs(
    renderZoneText(template.zones.intro ?? "", variables),
    "margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;",
  );
  const outroHtml = zoneToParagraphs(
    renderZoneText(template.zones.outro ?? "", variables),
    "margin: 0 0 8px 0; color: #6b7280; font-size: 14px; line-height: 1.6;",
  );

  const safeUrl = escapeHtml(resetUrl);

  const html = `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" lang="${copy.lang}">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${subject}</title>
    <!--[if mso]>
    <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
    <![endif]-->
    <style>
      @media only screen and (max-width: 620px) {
        .ludov-card { border-radius: 0 !important; }
        .ludov-pad { padding: 28px 22px !important; }
        .ludov-header { padding: 32px 22px !important; }
        .ludov-title { font-size: 24px !important; }
        .ludov-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; width: 100%; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

    <!-- Aperçu affiché dans la liste des messages, invisible à l'ouverture -->
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
      ${escapeHtml(copy.preheader)}
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
      <tr>
        <td align="center" style="padding: 40px 16px;">

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="ludov-card" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">

            <!-- En-tête -->
            <tr>
              <td class="ludov-header" style="background: #00b8db; background: linear-gradient(135deg, #00b8db 0%, #0092b8 100%); padding: 40px 30px; text-align: center;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 18px auto;">
                  <tr>
                    <td align="center" valign="middle" style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.18); border-radius: 16px; font-size: 30px; line-height: 64px;">
                      &#128274;
                    </td>
                  </tr>
                </table>
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 0.5px;">
                  LUDOV
                </h1>
                <p style="margin: 8px 0 0 0; color: #cefafe; font-size: 16px;">
                  ${escapeHtml(copy.headerSubtitle)}
                </p>
              </td>
            </tr>

            <!-- Contenu -->
            <tr>
              <td class="ludov-pad" style="padding: 40px 36px 32px 36px;">
                ${introHtml}

                <!-- Appel à l'action -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin: 28px 0 20px 0;">
                  <tr>
                    <td align="center">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeUrl}" style="height:52px;v-text-anchor:middle;width:300px;" arcsize="25%" stroke="f" fillcolor="#00b8db">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">${escapeHtml(copy.button)}</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <a href="${safeUrl}" class="ludov-btn" style="display: inline-block; background-color: #00b8db; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; line-height: 20px; padding: 16px 34px; border-radius: 12px; text-align: center; mso-hide: all;">
                        ${escapeHtml(copy.button)}
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>

                <!-- Durée de validité -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 28px;">
                  <tr>
                    <td align="center" style="color: #6b7280; font-size: 13px; line-height: 1.5;">
                      &#9201;&nbsp;${escapeHtml(copy.expiry)}
                    </td>
                  </tr>
                </table>

                <!-- Adresse de repli -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 18px 20px;">
                      <p style="margin: 0 0 6px 0; color: #374151; font-size: 13px; font-weight: 600;">
                        ${escapeHtml(copy.fallbackTitle)}
                      </p>
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                        ${escapeHtml(copy.fallbackHint)}
                      </p>
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; word-break: break-all;">
                        <a href="${safeUrl}" style="color: #0092b8; text-decoration: underline;">${safeUrl}</a>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Encadré de sécurité -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; margin-bottom: 26px;">
                  <tr>
                    <td style="padding: 20px;">
                      <p style="margin: 0 0 8px 0; color: #92400e; font-size: 15px; font-weight: 600;">
                        ${escapeHtml(copy.securityTitle)}
                      </p>
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        ${escapeHtml(copy.securityBody)}
                      </p>
                    </td>
                  </tr>
                </table>

                ${outroHtml}
              </td>
            </tr>

            <!-- Pied -->
            <tr>
              <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; color: #374151; font-size: 16px; font-weight: 600;">
                  ${escapeHtml(copy.footerLead)}
                </p>
                <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                  ${escapeHtml(copy.footerTeam)}
                </p>

                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                  <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                    ${escapeHtml(copy.footerNote)}
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} LUDOV. ${escapeHtml(copy.rights)}
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

  // Variante texte : certains clients l'affichent, et sa présence améliore le
  // classement anti-pourriel d'un message qui ne contient qu'un lien.
  const text = [
    renderZoneTextPlain(template.zones.intro ?? "", variables),
    "",
    `${copy.button} : ${resetUrl}`,
    "",
    copy.expiry,
    "",
    `${copy.securityTitle} ${copy.securityBody}`,
    "",
    renderZoneTextPlain(template.zones.outro ?? "", variables),
    "",
    copy.footerTeam,
  ].join("\n");

  return sendEmail({ to, subject, html, text });
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

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
    from: `"LUDOV - réservation" <no-reply@dyonisos.store>`,
    to,
    subject,
    text,
    html,
  });
  return response;
}

export async function sendResetPasswordEmail({
  to,
}: {
  to: string;
}): Promise<SMTPTransport.SentMessageInfo> {
  const subject = "Réinitialisation de votre mot de passe LUDOV";

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
              <td style="background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                  LUDOV
                </h1>
                <p style="margin: 10px 0 0 0; color: #dbeafe; font-size: 16px;">
                  Réinitialisation du mot de passe
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                  Bonjour,
                </p>

                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                  Nous avons reçu une demande de réinitialisation de votre mot de passe pour votre compte <strong>LUDOV</strong>.
                </p>

                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                  Votre mot de passe a été réinitialisé avec succès.
                </p>

                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                  Lors de votre prochaine connexion, veuillez cliquer sur <em>"Première connexion"</em> afin de définir un nouveau mot de passe.
                </p>

                <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px;">
                  Si vous n'êtes pas à l'origine de cette demande, veuillez contacter notre support immédiatement.
                </p>

                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  Si vous avez des questions ou éprouvez des difficultés, n'hésitez pas à nous contacter.
                </p>
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
}: {
  to: string;
}): Promise<SMTPTransport.SentMessageInfo> {
  const subject = "Bienvenue chez LUDOV !";

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
              <td style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                  LUDOV
                </h1>
                <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 16px;">
                  Confirmation d'inscription
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                  Bonjour,
                </p>
                
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                  Nous sommes ravis de vous accueillir au sein des laboratoires de <strong>LUDOV</strong> !
                </p>

                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                  Vous pouvez dès maintenant explorer la plateforme, consulter le catalogue et effectuer vos réservations.
                </p>

                <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px;">
                  Si vous avez des questions concernant vos emprunts, vos réservations ou le fonctionnement de la plateforme, n'hésitez pas à nous contacter.
                </p>
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


export async function sendDeleteAccountEmail({
  to,
  userName,
}: {
  to: string;
  userName: string;
}): Promise<SMTPTransport.SentMessageInfo> {
  const subject = "Confirmation de suppression de votre compte LUDOV";

  const html = `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          background-color: #f9f9f9;
          padding: 20px;
        }
        .container {
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #dc3545;
        }
        p {
          line-height: 1.6;
        }
        .footer {
          margin-top: 20px;
          font-size: 0.9rem;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Suppression de votre compte</h1>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Nous vous confirmons que votre compte <strong>LUDOV</strong> a bien été supprimé de nos systèmes.</p>
        <p>Toutes vos données personnelles associées ont été effacées conformément à notre politique de confidentialité.</p>
        <p>Merci d’avoir utilisé <strong>LUDOV</strong></p>
        <div class="footer">
          <p>— L’équipe LUDOV</p>
        </div>
      </div>
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
}: {
  to: string;
  userName: string;
  reservationId: string;
  date: string;
  time: string;
  consoleName: string;
}): Promise<SMTPTransport.SentMessageInfo> {
  const subject = "Rappel de votre réservation LUDOV";
  
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  const formattedDate = dateObj.toLocaleDateString("fr-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
                <td style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    LUDOV
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 16px;">
                    Rappel de réservation
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                    Bonjour <strong>${userName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px;">
                    Ceci est un rappel pour votre réservation à venir chez LUDOV.
                  </p>

                  <!-- Details Card -->
                  <table role="presentation" style="width: 100%; background-color: #f0fdfa; border: 2px solid #06b6d4; border-radius: 12px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 24px;">
                        <h2 style="margin: 0 0 20px 0; color: #0891b2; font-size: 18px;">
                          Détails de votre réservation
                        </h2>
                        
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #ccfbf1;">
                              <strong style="color: #0e7490;">Numéro :</strong> 
                              <span style="color: #164e63;">${reservationId}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #ccfbf1;">
                              <strong style="color: #0e7490;">Date :</strong> 
                              <span style="color: #164e63;">${formattedDate}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #ccfbf1;">
                              <strong style="color: #0e7490;">Heure :</strong> 
                              <span style="color: #164e63;">${time}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #ccfbf1;">
                              <strong style="color: #0e7490;">Console :</strong> 
                              <span style="color: #164e63;">${consoleName}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    Si vous avez des questions, n'hésitez pas à nous contacter.
                  </p>
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
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/withAuth";
import {
  isEmailLocale,
  isEmailTemplateKey,
} from "@/lib/emailTemplates";
import {
  sendCancellationEmail,
  sendConfirmationEmail,
  sendForgotPasswordEmail,
  sendReminderEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
} from "@/lib/sendEmail";
import { toLocalYmd } from "@/lib/dates";
import {
  RESET_TOKEN_TTL_MINUTES,
  buildResetUrl,
  generateResetToken,
} from "@/lib/passwordReset";

/**
 * Envoi d'un courriel de test (données d'exemple) à l'administrateur connecté,
 * pour vérifier le rendu d'un gabarit après modification.
 */
export const POST = withAdmin<{ key: string }>(async (req, admin, params) => {
  try {
    const key = params.key;
    if (!isEmailTemplateKey(key)) {
      return NextResponse.json(
        { success: false, error: "Gabarit inconnu." },
        { status: 404 },
      );
    }

    const locale = new URL(req.url).searchParams.get("locale") ?? "fr";
    if (!isEmailLocale(locale)) {
      return NextResponse.json(
        { success: false, error: "Locale invalide." },
        { status: 400 },
      );
    }

    const sample = {
      to: admin.email,
      userName: admin.name || "Prénom Nom",
      reservationId: "RESV-00000000-0000-0000-0000-000000000000",
      date: toLocalYmd(new Date()),
      time: "14:00",
      consoleName: "PlayStation 5",
      locale,
    };

    switch (key) {
      case "confirmation":
        await sendConfirmationEmail(sample);
        break;
      case "reminder":
        await sendReminderEmail(sample);
        break;
      case "cancellation":
        await sendCancellationEmail({
          ...sample,
          reason: locale === "en" ? "Test reason" : "Raison de test",
        });
        break;
      case "reset_password":
        await sendResetPasswordEmail({ to: admin.email, locale });
        break;
      case "forgot_password":
        // Jeton bien formé mais absent de la base : le lien du test mène à
        // l'écran « lien invalide », sans ouvrir d'accès au compte de l'admin.
        await sendForgotPasswordEmail({
          to: admin.email,
          locale,
          resetUrl: buildResetUrl(generateResetToken(), locale),
          expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
        });
        break;
      case "welcome":
        await sendWelcomeEmail({ to: admin.email, locale });
        break;
      case "otp": {
        // Réutilise le même rendu que la route OTP, avec un code factice.
        const { getTemplate, renderZoneTextPlain } = await import(
          "@/lib/emailTemplates"
        );
        const { sendEmail } = await import("@/lib/sendEmail");
        const template = await getTemplate("otp", locale);
        await sendEmail({
          to: admin.email,
          subject: template.subject,
          text: renderZoneTextPlain(template.zones.body ?? "", {
            otpCode: "123456",
          }),
        });
        break;
      }
      default: {
        // Garde d'exhaustivité : ajouter une clé à EMAIL_TEMPLATE_KEYS sans
        // brancher son envoi ici casse la compilation, plutôt que de faire
        // répondre « test envoyé » sans qu'aucun courriel ne parte.
        const unhandled: never = key;
        console.error(`Gabarit sans envoi de test : ${unhandled}`);
        return NextResponse.json(
          { success: false, error: "Ce gabarit n'a pas d'envoi de test." },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({ success: true, sentTo: admin.email });
  } catch (error) {
    console.error("Erreur envoi test courriel:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'envoi du test." },
      { status: 500 },
    );
  }
});

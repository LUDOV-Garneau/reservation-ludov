import { mailer } from "./mailer"

type SendEmailProps = {
    to: string
    subject: string
    text?: string
    html?: string
}

export async function sendEmail({ to, subject, text, html }: SendEmailProps) {
    await mailer.sendMail({
        from: `"Mon App" <no-reply@dyonisos.store>`,
        to,
        subject,
        text,
        html,
    })
}

import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
}: {
  to: string
  name: string | null
  resetToken: string
}) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: 'Reset your password',
    html: `
      <p>Hi ${name || 'there'},</p>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  })
}

export async function sendContractInvitation({
  to,
  name,
  contractTitle,
  signatureToken,
}: {
  to: string
  name: string
  contractTitle: string
  signatureToken: string
}) {
  const signUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${signatureToken}`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `Please sign: ${contractTitle}`,
    html: `
      <h1>Hi ${name},</h1>
      <p>You have been invited to sign a contract: <strong>${contractTitle}</strong></p>
      <p><a href="${signUrl}">Click here to review and sign</a></p>
      <p>This link is unique to you and should not be shared.</p>
    `,
  })
}

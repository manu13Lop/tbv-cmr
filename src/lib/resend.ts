import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY as string)

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Triana Balonmano Vivero <onboarding@resend.dev>"
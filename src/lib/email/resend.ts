import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789') // Fallback required to prevent crash if not set, handled in logic

import { z } from 'zod'

export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
})

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

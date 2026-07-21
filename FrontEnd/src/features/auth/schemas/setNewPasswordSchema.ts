import { z } from 'zod'

export const setNewPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
  password: z.string().min(1, 'Please enter a new password'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type SetNewPasswordValues = z.infer<typeof setNewPasswordSchema>

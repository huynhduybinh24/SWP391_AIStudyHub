import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Brain } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/loginSchema'
import { useLogin } from '@/features/auth/hooks/useLogin'

export function LoginForm() {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'alex@example.com', password: 'password' },
  })

  return (
    <div className="flex min-h-full items-center justify-center bg-surface p-6">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-icon-bg text-primary">
              <Brain className="size-7" />
            </div>
            <h1 className="text-2xl font-bold text-primary">AI Study Hub</h1>
            <p className="text-sm text-muted">Sign in to continue</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => login.mutate(values))}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-body" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" error={errors.email?.message} {...register('email')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-body" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
            {login.isError ? (
              <p className="text-sm text-danger">
                {login.error instanceof Error ? login.error.message : 'Login failed'}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted">
            Demo: alex@example.com / password (student) · admin@example.com / password (admin)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

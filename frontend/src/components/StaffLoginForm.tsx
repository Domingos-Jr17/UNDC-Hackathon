import { useLocation, useNavigate } from 'react-router-dom'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck, LockKeyhole, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthContext } from '../contexts/AuthContext'
import { z } from 'zod'
import { announceToScreenReader } from '../lib/accessibility'

const staffLoginSchema = z.object({
  email: z.string().email('Introduza um email institucional válido'),
  password: z.string().min(6, 'A palavra-passe deve ter pelo menos 6 caracteres'),
})

type StaffFormData = z.infer<typeof staffLoginSchema>

export default function StaffLoginForm() {
  const { staffLogin } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()

  const staffForm = useForm<StaffFormData>({
    resolver: zodResolver(staffLoginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard'

  const onStaffSubmit: SubmitHandler<StaffFormData> = async (data) => {
    try {
      const success = await staffLogin(data.email, data.password)
      if (success) {
        announceToScreenReader('Login de equipa realizado com sucesso')
        navigate(from, { replace: true })
      }
    } catch {
      announceToScreenReader('Erro ao realizar login da equipa')
    }
  }

  return (
    <Card className="w-full max-w-lg rounded-[32px] border-white/70 bg-white/95 shadow-2xl shadow-slate-900/10" role="main" aria-labelledby="staff-login-title">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <CardTitle id="staff-login-title" className="text-3xl font-semibold text-slate-950">
            Entrar no portal operacional
          </CardTitle>
          <CardDescription className="text-base text-slate-600">
            Use as suas credenciais institucionais para acompanhar ativações, progresso e relatórios da plataforma WIRA.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email institucional</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="equipa@ong.org"
                className="h-12 rounded-2xl bg-slate-50 pl-10"
                {...staffForm.register('email')}
                aria-invalid={!!staffForm.formState.errors.email}
                aria-describedby={staffForm.formState.errors.email ? 'email-error' : undefined}
              />
            </div>
            {staffForm.formState.errors.email ? (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {staffForm.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Introduza a palavra-passe"
                className="h-12 rounded-2xl bg-slate-50 pl-10"
                {...staffForm.register('password')}
                aria-invalid={!!staffForm.formState.errors.password}
                aria-describedby={staffForm.formState.errors.password ? 'password-error' : undefined}
              />
            </div>
            {staffForm.formState.errors.password ? (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {staffForm.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-2xl"
            disabled={staffForm.formState.isSubmitting}
          >
            {staffForm.formState.isSubmitting ? 'A entrar...' : 'Entrar no painel'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 border-t border-slate-100 bg-slate-50/70 text-sm text-slate-600">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p>
            Este ambiente é reservado à equipa operacional e apresenta dados sensíveis sobre beneficiárias e cursos.
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}

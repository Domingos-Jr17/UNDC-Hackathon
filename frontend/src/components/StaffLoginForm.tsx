import { useNavigate, useLocation } from 'react-router-dom';
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuthContext } from '../contexts/AuthContext';
import { z } from 'zod';
import { announceToScreenReader } from '../lib/accessibility';

// Staff login schema
const staffLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Victim login schema
const victimLoginSchema = z.object({
  code: z.string()
    .regex(/^V\d{4}$/i, 'Código deve estar no formato V#### (ex: V0001)')
    .length(5, 'Código deve ter exatamente 5 caracteres'),
});

type StaffFormData = z.infer<typeof staffLoginSchema>;
type VictimFormData = z.infer<typeof victimLoginSchema>;

export default function StaffLogin() {
  const { login, staffLogin } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const staffForm = useForm<StaffFormData>({
    resolver: zodResolver(staffLoginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const victimForm = useForm<VictimFormData>({
    resolver: zodResolver(victimLoginSchema),
    mode: "onChange",
    defaultValues: {
      code: "",
    },
  });

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const onStaffSubmit: SubmitHandler<StaffFormData> = async (data) => {
    try {
      const success = await staffLogin(data.email, data.password);
      if (success) {
        announceToScreenReader('Login de staff realizado com sucesso');
        navigate(from, { replace: true });
      }
    } catch (error) {
      announceToScreenReader('Erro ao realizar login de staff');
    }
  };

  const onVictimSubmit: SubmitHandler<VictimFormData> = async (data) => {
    try {
      const success = await login(data.code);
      if (success) {
        announceToScreenReader('Login realizado com sucesso');
        navigate(from, { replace: true });
      }
    } catch (error) {
      announceToScreenReader('Erro ao realizar login');
    }
  };

  return (
    <Card className="w-full max-w-md" role="main" aria-labelledby="staff-login-title">
        <CardHeader className="text-center">
          <CardTitle
            id="staff-login-title"
            className='flex justify-center text-2xl font-bold'
          >
            WIRA
          </CardTitle>
          <CardDescription>
            Portal da Equipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="staff" className="w-full">

            <TabsContent value="staff" className="space-y-4">
              <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@ong.org"
                    {...staffForm.register('email')}
                    aria-invalid={!!staffForm.formState.errors.email}
                    aria-describedby={staffForm.formState.errors.email ? 'email-error' : undefined}
                  />
                  {staffForm.formState.errors.email && (
                    <p id="email-error" className="text-sm text-destructive" role="alert">
                      {staffForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...staffForm.register('password')}
                    aria-invalid={!!staffForm.formState.errors.password}
                    aria-describedby={staffForm.formState.errors.password ? 'password-error' : undefined}
                  />
                  {staffForm.formState.errors.password && (
                    <p id="password-error" className="text-sm text-destructive" role="alert">
                      {staffForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                  <div className='flex justify-center'>
                  <Button
                  type="submit"
                  className="fit-content "
                  disabled={staffForm.formState.isSubmitting}
                >
                  {staffForm.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
                </Button>
                  </div>

                
              </form>
            </TabsContent>

            <TabsContent value="victim" className="space-y-4">
              <form onSubmit={victimForm.handleSubmit(onVictimSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código de Acesso</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="V0001"
                    maxLength={5}
                    {...victimForm.register('code')}
                    aria-invalid={!!victimForm.formState.errors.code}
                    aria-describedby={victimForm.formState.errors.code ? 'code-error' : undefined}
                  />
                  {victimForm.formState.errors.code && (
                    <p id="code-error" className="text-sm text-destructive" role="alert">
                      {victimForm.formState.errors.code.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Use o código anônimo informado pela equipe da ONG.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={victimForm.formState.isSubmitting}
                >
                  {victimForm.formState.isSubmitting ? 'Entrando...' : 'Entrar como Vítima'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground w-full">
            Use o seu email e senha para aceder a plataforma
          </p>
        </CardFooter>
      </Card>
  );
}

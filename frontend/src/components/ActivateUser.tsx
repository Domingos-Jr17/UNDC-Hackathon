"use client"
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TypographySmall, TypographyMuted } from '@/components/ui/typography';
import { Spinner } from '@/components/ui/spinner';
import { UserPlus, UserCheck, Shield, MessageSquare } from 'lucide-react';
import { toast } from "sonner";
import { activateUserSchema, validateDate, ActivateUserFormData } from '../lib/schemas';
import Layout from './layout/Layout';
import { useUserActivation } from '../hooks/useApi';

export default function ActivateUser() {
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const { loading, activateUser, sendSMS } = useUserActivation();

    const form = useForm({
        resolver: zodResolver(activateUserSchema),
        mode: "onChange",
        defaultValues: {
            realName: '',
            ngoId: '',
            initialSkills: '',
            dateOfBirth: '',
            phone: ''
        }
    });

    const { register, handleSubmit, getValues, formState: { errors, isValid } } = form;

    const handleGenerateCode = useCallback(async (data: ActivateUserFormData) => {
        // Validar data de nascimento
        if (data.dateOfBirth && !validateDate(data.dateOfBirth)) {
            toast.error('Data de nascimento inválida');
            return;
        }

        const id = toast.loading('Gerando código...');

        try {
            const user = await activateUser({
                ...data,
                phone: data.phone?.trim() ? data.phone.trim() : undefined
            });
            const newCode = user.anonymousCode;
            setGeneratedCode(newCode);
            toast.dismiss(id);
            toast.success(`Código gerado com sucesso: ${newCode}`);
        } catch {
            toast.dismiss(id);
        }
    }, [activateUser]);

    const handleSendSMS = useCallback(async () => {
        if (!generatedCode) {
            toast.error('Gere um código primeiro');
            return;
        }

        const phone = getValues('phone')?.trim();
        if (!phone) {
            toast.error('Informe um telefone válido para enviar o SMS.');
            return;
        }

        const id = toast.loading('Enviando SMS...');
        try {
            await sendSMS(generatedCode, phone);
            toast.dismiss(id);
        } catch {
            toast.dismiss(id);
        }
    }, [generatedCode, getValues, sendSMS]); 

    return (
        <Layout
            title="Activar Novo Usuário"
            subtitle="Gere códigos de acesso anónimos para novas sobreviventes"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-primary" />
                            Informações do Usuário
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form id="userForm" onSubmit={handleSubmit(handleGenerateCode)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="realName">Nome Completo</Label>
                                <Input
                                    id="realName"
                                    required
                                    placeholder="Beneficiária A"
                                    {...register('realName')}
                                    aria-invalid={errors.realName ? "true" : "false"}
                                />
                                {errors.realName && (
                                    <p className="text-sm text-destructive mt-1">{errors.realName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                                <Input
                                    id="dateOfBirth"
                                    required
                                    placeholder="DD/MM/AAAA"
                                    {...register('dateOfBirth')}
                                    aria-invalid={errors.dateOfBirth ? "true" : "false"}
                                />
                                {errors.dateOfBirth && (
                                    <p className="text-sm text-destructive mt-1">{errors.dateOfBirth.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ngoId">ONG de Acolhimento</Label>
                                <Input
                                    id="ngoId"
                                    required
                                    placeholder="ONG-001"
                                    {...register('ngoId')}
                                    aria-invalid={errors.ngoId ? "true" : "false"}
                                />
                                {errors.ngoId && (
                                    <p className="text-sm text-destructive mt-1">{errors.ngoId.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone (SMS)</Label>
                                <Input
                                    id="phone"
                                    placeholder="+258841234567"
                                    {...register('phone')}
                                    aria-invalid={errors.phone ? "true" : "false"}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="initialSkills">Habilidades Iniciais</Label>
                                <textarea
                                    id="initialSkills"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Costura básica, culinária, agricultura..."
                                    rows={3}
                                    {...register('initialSkills')}
                                />
                                {errors.initialSkills && (
                                    <p className="text-sm text-destructive mt-1">{errors.initialSkills.message}</p>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Code Generation Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Gerar Código de Acesso
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            type="submit"
                            form="userForm"
                            className="w-full"
                            size="lg"
                            disabled={loading || !isValid}
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Gerando Código...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Gerar Código de Acesso
                                </>
                            )}
                        </Button>

                        {generatedCode && (
                            <div className="space-y-4">
                                <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
                                    <div className="text-center space-y-2">
                                        <TypographySmall className="text-primary font-medium">
                                            Código Gerado:
                                        </TypographySmall>
                                        <div className="text-3xl font-bold text-primary font-mono tracking-wider">
                                            {generatedCode}
                                        </div>
                                        <TypographySmall className="text-muted-foreground">
                                            Guarde este código para o usuário aceder à aplicação WIRA
                                        </TypographySmall>
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => {
                                        void handleSendSMS();
                                    }}
                                    disabled={!generatedCode}
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Enviar Código por SMS
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Security Notice */}
            <Card className="mt-6 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                            <TypographyMuted className="font-medium text-foreground">
                                Proteção de Identidade
                            </TypographyMuted>
                            <TypographyMuted className="text-sm">
                                O usuário receberá um código anónimo para aceder à aplicação WIRA.
                                Seu nome real e informações pessoais nunca serão expostos no sistema,
                                garantindo total privacidade e segurança para a sobrevivente.
                            </TypographyMuted>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Layout>
    );
}



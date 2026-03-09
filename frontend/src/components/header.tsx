import {Button} from "@/components/ui/button"
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useAuthContext } from '../contexts/AuthContext';
import { TypographySmall } from '@/components/ui/typography';
export const Header = () => {
     const navigate = useNavigate();
     const { user, logout } = useAuthContext();

    const handleActivateUser = () => {
        navigate("/active")
    };

    const handleGenerateReport = () => {
        toast.info('Função de geração de relatório - em desenvolvimento');
    };

    const handleLogout = () => {
        logout();
    };

  return (
    <header className="flex justify-between items-center w-full bg-blue-800 h-20 px-6">
        <div className="flex items-center gap-4">
            <div className=" bg-[url('/public/logo.png')] bg-cover bg-center bg-no-repeat w-12 h-12"></div>
            {user && (
                <div className="text-white">
                    <TypographySmall className="text-white/80">Código: {user.anonymousCode}</TypographySmall>
                    <TypographySmall className="text-white/80">ONG: {user.ngoId}</TypographySmall>
                </div>
            )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
            <Button
                variant="secondary"
                onClick={handleGenerateReport}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
                Gerar Relatório
            </Button>

            <Button
                variant="secondary"
                onClick={handleActivateUser}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
                Ativar Novo Usuário
            </Button>

            <Button
                variant="destructive"
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700"
            >
                Sair
            </Button>
        </div>
    </header>
  )}

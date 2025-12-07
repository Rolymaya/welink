'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function CompleteOnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function onComplete() {
        setLoading(true);
        try {
            await api.patch('/organization/complete-onboarding');
            toast.success('Configuração concluída!');
            router.push('/company/dashboard');
        } catch (error) {
            console.error('Error completing onboarding:', error);
            toast.error('Erro ao finalizar configuração. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-900">Tudo pronto!</h2>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                    Sua empresa foi configurada com sucesso. Agora você pode acessar o painel administrativo e começar a usar a plataforma.
                </p>
            </div>

            <div className="pt-4">
                <Button size="lg" className="w-full max-w-sm" onClick={onComplete} disabled={loading}>
                    {loading ? 'Finalizando...' : 'Ir para o Dashboard'}
                </Button>
            </div>
        </div>
    );
}

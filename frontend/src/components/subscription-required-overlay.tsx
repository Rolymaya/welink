'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CreditCard } from 'lucide-react';

interface SubscriptionRequiredOverlayProps {
    show: boolean;
}

export default function SubscriptionRequiredOverlay({ show }: SubscriptionRequiredOverlayProps) {
    const router = useRouter();

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 shadow-2xl border-purple-500/20">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Subscrição Necessária</CardTitle>
                    <CardDescription className="text-base">
                        Para aceder a esta funcionalidade, precisa de adquirir um pacote de subscrição.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Com uma subscrição ativa, terá acesso a:
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li>✓ Criação e gestão de agentes</li>
                            <li>✓ Base de conhecimento ilimitada</li>
                            <li>✓ Integração com WhatsApp</li>
                            <li>✓ Estatísticas e relatórios</li>
                            <li>✓ Suporte prioritário</li>
                        </ul>
                    </div>
                    <Button
                        onClick={() => router.push('/company/billing')}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        size="lg"
                    >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Ver Pacotes Disponíveis
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

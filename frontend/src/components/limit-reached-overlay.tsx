'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CreditCard } from 'lucide-react';

interface LimitReachedOverlayProps {
    show: boolean;
    resourceType: string; // 'agentes', 'sessões', etc.
    currentLimit: number;
    onClose: () => void;
}

export default function LimitReachedOverlay({ show, resourceType, currentLimit, onClose }: LimitReachedOverlayProps) {
    const router = useRouter();

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 shadow-2xl border-orange-500/20">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <TrendingUp className="h-8 w-8 text-orange-500" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Limite Atingido</CardTitle>
                    <CardDescription className="text-base">
                        Atingiu o limite de {currentLimit} {resourceType} do seu plano atual.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            Para criar mais {resourceType}, faça upgrade do seu plano e tenha acesso a:
                        </p>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li>✓ Mais {resourceType}</li>
                            <li>✓ Recursos adicionais</li>
                            <li>✓ Funcionalidades premium</li>
                            <li>✓ Suporte prioritário</li>
                        </ul>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => router.push('/company/billing')}
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Fazer Upgrade
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

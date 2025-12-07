import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Configuração da Empresa</h1>
                    <p className="text-gray-600 mt-2">Vamos configurar sua conta empresarial em poucos passos</p>
                </div>

                <Card className="border-0 shadow-lg">
                    <CardContent className="p-8">
                        {children}
                    </CardContent>
                </Card>

                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>© 2025 WeLink AI. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
}

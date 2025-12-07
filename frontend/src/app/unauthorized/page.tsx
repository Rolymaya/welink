'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function UnauthorizedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AlertTriangle className="h-16 w-16 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl">Acesso Negado</CardTitle>
                    <CardDescription>
                        Você não tem permissão para acessar esta página.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Esta página requer privilégios de administrador. Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className="flex-1"
                        >
                            Voltar
                        </Button>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            className="flex-1"
                        >
                            Fazer Login
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

export default function SuperAdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Verificar se já está logado como super admin
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/profile');
                    if (res.data.role === 'SUPER_ADMIN') {
                        // Já logado como super admin, redirecionar
                        router.push('/admin/dashboard');
                    } else {
                        // Logado, mas não como super admin, limpar token
                        localStorage.removeItem('token');
                        setChecking(false);
                    }
                } catch (error) {
                    // Token inválido, limpar
                    localStorage.removeItem('token');
                    setChecking(false);
                }
            } else {
                setChecking(false);
            }
        };
        checkAuth();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/auth/login', { email, password });
            const token = res.data.access_token;

            localStorage.setItem('token', token);

            // Verificar se o usuário é super admin
            const profileRes = await api.get('/auth/profile');
            if (profileRes.data.role === 'SUPER_ADMIN') {
                toast.success('Bem-vindo, Super Admin!');
                router.push('/admin/dashboard');
            } else {
                localStorage.removeItem('token');
                toast.error('Acesso negado. Credenciais de Super Admin necessárias.');
            }
        } catch (error) {
            toast.error('Credenciais inválidas');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
                <Card className="w-full max-w-md border-purple-500/20">
                    <CardContent className="py-12 text-center">
                        <p className="text-purple-300">Verificando autenticação...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <Card className="w-full max-w-md border-purple-500/20">
                <CardHeader className="space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Shield className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>
                    <CardTitle className="text-center text-2xl">Acesso Super Admin</CardTitle>
                    <CardDescription className="text-center">
                        Entre com suas credenciais de super administrador para acessar o painel
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@exemplo.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            disabled={loading}
                        >
                            {loading ? 'Entrando...' : 'Entrar como Super Admin'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            <Link href="/" className="hover:text-purple-500 transition-colors">
                                ← Voltar para início
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

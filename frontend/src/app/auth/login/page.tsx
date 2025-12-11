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
import { LayoutDashboard } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if already logged in
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/profile');
                    // Already logged in, redirect based on role
                    if (res.data.role === 'SUPER_ADMIN') {
                        router.push('/admin/dashboard');
                    } else if (res.data.organizationId) {
                        router.push('/company/dashboard');
                    } else {
                        router.push('/onboarding');
                    }
                } catch (error) {
                    // Token invalid, clear it
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
            toast.success('Login realizado com sucesso');

            // Redirect based on role
            if (res.data.user.role === 'SUPER_ADMIN') {
                router.push('/admin/dashboard');
            } else if (res.data.user.organizationId) {
                router.push('/company/dashboard');
            } else {
                router.push('/onboarding');
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
                            <LayoutDashboard className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>
                    <CardTitle className="text-center text-2xl">Acessar Conta</CardTitle>
                    <CardDescription className="text-center">
                        Entre com seu email para acessar a plataforma
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <Link href="/auth/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 hover:underline">
                                    Esqueceu a senha?
                                </Link>
                            </div>
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
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Não tem uma conta?{' '}
                            <Link href="/auth/register" className="text-purple-400 hover:text-purple-300 hover:underline">
                                Cadastre-se
                            </Link>
                        </div>
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

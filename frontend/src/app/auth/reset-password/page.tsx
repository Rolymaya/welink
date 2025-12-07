'use client';
import { buildApiUrl } from '@/lib/apiUrl';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, CheckCircle2, Eye, EyeOff } from 'lucide-react';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Token inválido ou ausente.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(buildApiUrl(''), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/auth/login'), 3000);
            } else {
                const data = await response.json();
                setError(data.message || 'Token inválido ou expirado.');
            }
        } catch (err) {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-4">
                    <div className="flex items-center justify-center">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <Bot className="h-7 w-7 text-white" />
                        </div>
                    </div>
                    <div className="text-center">
                        <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
                        <CardDescription>
                            {success ? 'Senha alterada com sucesso!' : 'Crie uma nova senha para sua conta'}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    {success ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Senha redefinida com sucesso!
                                </p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                Você será redirecionado para a página de login em breve...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nova Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Repita a senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                disabled={loading || !token}
                            >
                                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                            </Button>

                            <Link href="/auth/login" className="block">
                                <Button variant="ghost" className="w-full">
                                    Voltar ao Login
                                </Button>
                            </Link>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}

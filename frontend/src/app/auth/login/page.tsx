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

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        try {
            const res = await api.post('/auth/login', { email, password });
            const token = res.data.access_token;

            localStorage.setItem('token', token);
            toast.success('Login successful');

            // Redirect based on role
            if (res.data.user.role === 'SUPER_ADMIN') {
                router.push('/admin/dashboard');
            } else if (res.data.user.organizationId) {
                router.push('/company/dashboard');
            } else {
                router.push('/onboarding');
            }
        } catch (error) {
            toast.error('Invalid credentials');
        }
    };

    if (checking) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <p>Verificando autenticação...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sign in to your account</CardTitle>
                <CardDescription>Enter your email below to login to your account</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
                        </div>
                        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full">Sign in</Button>
                    <div className="text-center text-sm">
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/register" className="text-primary hover:underline">Sign up</Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

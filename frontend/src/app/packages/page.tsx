import { buildApiUrl } from '@/lib/apiUrl';
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Package {
    id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    maxAgents: number;
    maxSessions: number;
    maxContacts: number;
    allowAudioResponse: boolean;
    allowScheduling: boolean;
    isActive: boolean;
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await fetch(buildApiUrl(''));
            if (response.ok) {
                const data = await response.json();
                const activePackages = data
                    .filter((pkg: Package) => pkg.isActive)
                    .sort((a: Package, b: Package) => a.price - b.price);
                setPackages(activePackages);
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    const gradients = [
        'from-blue-500 to-cyan-500',
        'from-purple-500 to-pink-500',
        'from-orange-500 to-red-500',
        'from-green-500 to-emerald-500',
        'from-indigo-500 to-purple-500',
        'from-pink-500 to-rose-500'
    ];

    const borderColors = [
        'border-blue-500',
        'border-purple-500',
        'border-orange-500',
        'border-green-500',
        'border-indigo-500',
        'border-pink-500'
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm dark:bg-gray-950/95 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                WeLinkAI
                            </span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <Button variant="ghost">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Voltar
                                </Button>
                            </Link>
                            <Link href="/auth/login">
                                <Button variant="ghost">Entrar</Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                    Começar Grátis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Todos os Nossos <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pacotes</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                            Escolha o plano perfeito para o seu negócio
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">A carregar pacotes...</p>
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400 text-lg">Nenhum pacote disponível no momento.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {packages.map((pkg, index) => {
                                const gradient = gradients[index % gradients.length];
                                const borderColor = borderColors[index % borderColors.length];
                                const isPopular = index === Math.floor(packages.length / 2);

                                const features = [
                                    `${pkg.maxAgents} ${pkg.maxAgents === 1 ? 'Agente' : 'Agentes'} de IA`,
                                    `${pkg.maxSessions} ${pkg.maxSessions === 1 ? 'Sessão' : 'Sessões'} WhatsApp`,
                                    `${pkg.maxContacts.toLocaleString()} Contactos`,
                                    'Base de conhecimento',
                                    ...(pkg.allowScheduling ? ['Agendamentos'] : []),
                                    ...(pkg.allowAudioResponse ? ['Respostas em áudio'] : []),
                                    'Analytics completo',
                                    'Suporte técnico'
                                ];

                                return (
                                    <Card
                                        key={pkg.id}
                                        className={`relative border-4 ${borderColor} ${isPopular ? 'shadow-2xl' : ''} hover:shadow-xl transition-all duration-300`}
                                    >
                                        {isPopular && (
                                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                                    MAIS POPULAR
                                                </div>
                                            </div>
                                        )}
                                        <CardContent className="pt-8 space-y-6">
                                            <div>
                                                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm">{pkg.description}</p>
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`text-5xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                                                        {new Intl.NumberFormat('pt-AO').format(pkg.price)}
                                                    </span>
                                                    <span className="text-gray-600 dark:text-gray-400">Kz</span>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">por {pkg.durationDays} dias</p>
                                            </div>
                                            <ul className="space-y-3">
                                                {features.map((feature, i) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <CheckCircle2 className={`h-5 w-5 flex-shrink-0 mt-0.5 bg-gradient-to-r ${gradient} text-white rounded-full`} />
                                                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <Link href="/auth/register">
                                                <Button className={`w-full h-12 text-lg bg-gradient-to-r ${gradient} hover:opacity-90`}>
                                                    Escolher Plano
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section className="py-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            Ainda com Dúvidas?
                        </h2>
                        <p className="text-xl text-blue-100">
                            Entre em contacto connosco e teremos prazer em ajudar a escolher o melhor plano
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link href="/#contact">
                                <Button size="lg" variant="secondary" className="text-lg px-8 h-12">
                                    Falar Connosco
                                </Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button size="lg" variant="outline" className="text-lg px-8 h-12 bg-white/10 hover:bg-white/20 text-white border-white/30">
                                    Começar Teste Grátis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-gray-900 text-gray-300 py-8">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">WeLinkAI</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            © 2025 WeLinkAI. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

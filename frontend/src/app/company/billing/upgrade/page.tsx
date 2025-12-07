'use client';
import { buildApiUrl } from '@/lib/apiUrl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
}

export default function UpgradePlanPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl('')), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setPackages(data);
            } else {
                console.error('Failed to fetch packages');
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p>Carregando planos disponíveis...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/company/billing">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Escolha seu Plano</h1>
                    <p className="text-muted-foreground">Selecione o plano ideal para o seu negócio.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {packages.map((pkg) => (
                    <Card key={pkg.id} className="flex flex-col border-purple-500/20 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                            <CardDescription>{pkg.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="text-3xl font-bold">
                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(pkg.price)}
                                <span className="text-sm font-normal text-muted-foreground"> / {pkg.durationDays} dias</span>
                            </div>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center">
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                    {pkg.maxAgents} Agentes
                                </li>
                                <li className="flex items-center">
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                    {pkg.maxSessions} Sessões WhatsApp
                                </li>
                                <li className="flex items-center">
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                    {pkg.maxContacts} Contactos
                                </li>
                                {pkg.allowAudioResponse && (
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500" />
                                        Respostas de Áudio (IA)
                                    </li>
                                )}
                                {pkg.allowScheduling && (
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500" />
                                        Agendamento Automático
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/company/billing/subscribe/${pkg.id}`} className="w-full">
                                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                                    Selecionar Plano
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

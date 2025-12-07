'use client';
import { buildApiUrl } from '@/lib/apiUrl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, CreditCard, Users, MessageSquare, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Subscription {
    id: string;
    package: {
        name: string;
        price: number;
        description: string;
        maxAgents: number;
        maxSessions: number;
        maxSessions: number;
        maxContacts: number;
    };
    organization?: {
        maxAgents: number;
        maxSessions: number;
        maxContacts: number;
    };
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT';
}

interface Usage {
    agents: number;
    sessions: number;
    contacts: number;
}

export default function BillingPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<Usage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [subRes, usageRes] = await Promise.all([
                fetch(buildApiUrl('')), { headers }),
                fetch(buildApiUrl('')), { headers })
            ]);

            if (subRes.ok) {
                const text = await subRes.text();
                const subData = text ? JSON.parse(text) : null;
                setSubscription(subData);
            }

            if (usageRes.ok) {
                const usageData = await usageRes.json();
                setUsage(usageData);
            }
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p>Carregando informações de faturação...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Faturação e Plano</h1>
                    <p className="text-muted-foreground">Gerencie sua subscrição e veja o uso de recursos.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/company/billing/transactions">
                        <Button variant="outline">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Ver Transações
                        </Button>
                    </Link>
                    <Link href="/company/billing/upgrade">
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Atualizar Plano
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Plan Card */}
                <Card className="border-purple-500/20 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Plano Atual</span>
                            {subscription ? (
                                <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'destructive'}>
                                    {subscription.status === 'ACTIVE' ? 'Ativo' : subscription.status}
                                </Badge>
                            ) : (
                                <Badge variant="outline">Nenhum Plano Ativo</Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Detalhes da sua subscrição atual
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {subscription ? (
                            <>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-purple-600">{subscription.package.name}</p>
                                    <p className="text-sm text-muted-foreground">{subscription.package.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Preço</p>
                                        <p className="font-medium">
                                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(subscription.package.price)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Expira em</p>
                                        <p className="font-medium">
                                            {format(new Date(subscription.endDate), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                                <p className="text-muted-foreground">Você não tem uma subscrição ativa.</p>
                                <Link href="/company/billing/upgrade" className="text-purple-600 hover:underline text-sm mt-2 block">
                                    Escolher um plano
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Usage Stats Card */}
                <Card className="border-purple-500/20 shadow-sm">
                    <CardHeader>
                        <CardTitle>Uso de Recursos</CardTitle>
                        <CardDescription>
                            Acompanhe o consumo dos limites do seu plano
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {subscription && usage ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-purple-500" />
                                            <span>Agentes</span>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {usage.agents} / {subscription.organization?.maxAgents ?? subscription.package.maxAgents}
                                        </span>
                                    </div>
                                    <Progress value={(usage.agents / (subscription.organization?.maxAgents ?? subscription.package.maxAgents)) * 100} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-blue-500" />
                                            <span>Sessões (WhatsApp)</span>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {usage.sessions} / {subscription.organization?.maxSessions ?? subscription.package.maxSessions}
                                        </span>
                                    </div>
                                    <Progress value={(usage.sessions / (subscription.organization?.maxSessions ?? subscription.package.maxSessions)) * 100} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <UserPlus className="h-4 w-4 text-green-500" />
                                            <span>Contactos</span>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {usage.contacts} / {subscription.organization?.maxContacts ?? subscription.package.maxContacts}
                                        </span>
                                    </div>
                                    <Progress value={(usage.contacts / (subscription.organization?.maxContacts ?? subscription.package.maxContacts)) * 100} className="h-2" />
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                Informações de uso indisponíveis.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}

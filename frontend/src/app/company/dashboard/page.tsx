'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, Smartphone, Plus, ArrowUpRight, Users } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';

interface DashboardStats {
    agents: {
        total: number;
        active: number;
        paused: number;
    };
    messages: {
        today: number;
    };
    sessions: {
        total: number;
        connected: number;
    };
    upcomingAppointments: number;
    recentActivity: Array<{
        id: string;
        contactName: string;
        contactPhone: string;
        content: string;
        createdAt: string;
    }>;
}

export default function CompanyDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            const response = await api.get('/organization/dashboard-stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            toast.error('Erro ao carregar estatísticas');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">A carregar...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Erro ao carregar dados</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 mt-2">Visão geral da sua operação de IA.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/company/agents/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Agente
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-purple-100">Agentes Ativos</CardTitle>
                        <Bot className="h-4 w-4 text-purple-100" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold">{stats.agents.active}</div>
                        <p className="text-xs text-purple-100 mt-1">
                            {stats.agents.paused > 0 ? `${stats.agents.paused} pausado(s)` : 'Todos ativos'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-blue-100">Mensagens Hoje</CardTitle>
                        <MessageSquare className="h-4 w-4 text-blue-100" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold">{stats.messages.today}</div>
                        <p className="text-xs text-blue-100 mt-1 flex items-center">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            Conversas processadas
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-green-100">Sessões WhatsApp</CardTitle>
                        <Smartphone className="h-4 w-4 text-green-100" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold">{stats.sessions.connected}</div>
                        <p className="text-xs text-green-100 mt-1">
                            {stats.sessions.total} total
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-orange-100">Agendamentos Futuros</CardTitle>
                        <Users className="h-4 w-4 text-orange-100" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold">{stats.upcomingAppointments || 0}</div>
                        <p className="text-xs text-orange-100 mt-1">
                            A partir de hoje
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Nenhuma atividade recente
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {stats.recentActivity.slice(0, 5).map((activity) => {
                                    const initials = activity.contactName
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .substring(0, 2)
                                        .toUpperCase();

                                    const timeAgo = getTimeAgo(new Date(activity.createdAt));

                                    return (
                                        <div key={activity.id} className="flex items-center">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {initials}
                                            </div>
                                            <div className="ml-4 space-y-1 flex-1">
                                                <p className="text-sm font-medium leading-none">{activity.contactName}</p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {activity.content}
                                                </p>
                                            </div>
                                            <div className="ml-auto font-medium text-xs text-gray-500">{timeAgo}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/company/knowledge">
                                <ArrowUpRight className="mr-2 h-4 w-4" />
                                Carregar Base de Conhecimento
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/company/whatsapp">
                                <ArrowUpRight className="mr-2 h-4 w-4" />
                                Conectar WhatsApp
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/company/contacts">
                                <ArrowUpRight className="mr-2 h-4 w-4" />
                                Ver Contactos
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Agora';
    if (seconds < 3600) return `Há ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Há ${Math.floor(seconds / 3600)} h`;
    return `Há ${Math.floor(seconds / 86400)} dias`;
}

'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, DollarSign, MessageSquare, Users, Package, TrendingUp, CreditCard, ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e', '#14b8a6', '#a855f7'];

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth('SUPER_ADMIN');

    useEffect(() => {
        if (!authLoading && user) {
            loadStats();
        }
    }, [authLoading, user]);

    async function loadStats() {
        try {
            const response = await api.get('/super-admin/stats');
            setData(response.data);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    }

    if (authLoading || loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </AdminLayout>
        );
    }

    const { overview, charts } = data || {};

    return (
        <AdminLayout>
            <div className="space-y-8 p-2">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Geral</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Visão geral do desempenho da plataforma SaaS</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-500 px-2">Última atualização: {new Date().toLocaleTimeString()}</span>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-blue-100">Receita Total</CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-100" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(overview?.totalRevenue || 0)}
                            </div>
                            <p className="text-xs text-blue-100 mt-1 flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                Total acumulado
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-purple-100">Empresas Ativas</CardTitle>
                            <Users className="h-4 w-4 text-purple-100" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{overview?.totalOrganizations || 0}</div>
                            <p className="text-xs text-purple-100 mt-1">
                                {overview?.activeSubscriptions || 0} com subscrição ativa
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-pink-600 to-pink-700 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-pink-100">Compras Pendentes</CardTitle>
                            <Activity className="h-4 w-4 text-pink-100" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{overview?.pendingPurchases || 0}</div>
                            <p className="text-xs text-pink-100 mt-1">
                                Aguardando aprovação
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-orange-100">Sessões WhatsApp</CardTitle>
                            <MessageSquare className="h-4 w-4 text-orange-100" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{overview?.totalSessions || 0}</div>
                            <p className="text-xs text-orange-100 mt-1">
                                {overview?.totalAgents || 0} agentes criados
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="shadow-md border border-gray-100 dark:border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">Receita Mensal</CardTitle>
                            <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts?.monthlyRevenue || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={(value) => {
                                            if (!value) return '';
                                            const [year, month] = value.split('-');
                                            return `${month}/${year}`;
                                        }}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        domain={[0, 1000000]}
                                        tickFormatter={(value) => {
                                            if (value >= 1000000) return `Kz ${(value / 1000000).toFixed(0)}M`;
                                            return `Kz ${(value / 1000).toFixed(0)}k`;
                                        }}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value), 'Receita']}
                                        labelFormatter={(label) => `Mês: ${label}`}
                                    />
                                    <Bar dataKey="amount" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md border border-gray-100 dark:border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">Mensagens por Empresa</CardTitle>
                            <CardDescription>Top 10 empresas com mais mensagens este mês</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[450px]">
                            {charts?.messagesByOrganization && charts.messagesByOrganization.length > 0 ? (
                                <div className="h-full flex flex-col">
                                    <ResponsiveContainer width="100%" height="75%">
                                        <PieChart>
                                            <Pie
                                                data={charts.messagesByOrganization}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="count"
                                            >
                                                {charts.messagesByOrganization.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: number) => [value, 'Mensagens']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="grid grid-cols-2 gap-2 px-4 mt-2">
                                        {charts.messagesByOrganization.map((item: any, index: number) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                                    {item.name} ({item.count})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50/50 dark:bg-gray-800/50 rounded-md border border-dashed border-gray-200 dark:border-gray-700">
                                    <div className="text-center p-6">
                                        <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sem dados ainda</h3>
                                        <p className="text-sm text-gray-500 mt-1">Nenhuma mensagem registada este mês.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}

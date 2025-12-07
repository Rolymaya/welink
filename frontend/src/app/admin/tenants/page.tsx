'use client';
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Organization {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
    _count?: {
        agents: number;
    };
    agents?: Array<{
        _count: {
            sessions: number;
        };
    }>;
}

export default function TenantsPage() {
    const { user, loading: authLoading } = useAuth('SUPER_ADMIN');
    const [tenants, setTenants] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!authLoading && user) {
            fetchTenants();
        }
    }, [authLoading, user]);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/organization');
            setTenants(res.data);
        } catch (error) {
            console.error('Failed to fetch tenants', error);
            toast.error('Erro ao carregar empresas');
        } finally {
            setLoading(false);
        }
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <p>Verificando autenticação...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Empresas (Tenants)</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Gerir todas as empresas registadas na plataforma
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Lista de Empresas</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Pesquisar empresas..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 w-64"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">A carregar...</div>
                        ) : filteredTenants.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                                    Nenhuma empresa encontrada
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm ? 'Tente outro termo de pesquisa' : 'Ainda não há empresas registadas'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredTenants.map((tenant) => (
                                    <div
                                        key={tenant.id}
                                        className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent"></div>
                                        <div className="relative p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                                        <Building2 className="h-7 w-7 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                            {tenant.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                                                            {tenant.email}
                                                        </p>
                                                        {tenant.phone && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                📞 {tenant.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    {tenant._count && (
                                                        <div className="flex gap-6">
                                                            <div className="text-center">
                                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 mb-1">
                                                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                                        {tenant.agents?.reduce((sum, agent) => sum + agent._count.sessions, 0) || 0}
                                                                    </p>
                                                                </div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sessões</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 mb-1">
                                                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                                                        {tenant._count.agents}
                                                                    </p>
                                                                </div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Agentes</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Registado em</p>
                                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
                                                            {new Date(tenant.createdAt).toLocaleDateString('pt-PT', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

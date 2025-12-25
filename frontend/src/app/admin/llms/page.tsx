'use client';
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Cpu } from 'lucide-react';
import api from '@/lib/api';
import { LLMProviderTable } from '@/components/admin/llm-table';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LLMProviderForm } from '@/components/admin/llm-form';
import { PageHeader, PAGE_ANIMATION } from '@/components/page-header';
import { cn } from '@/lib/utils';

export default function LLMManagementPage() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<any>(null);

    const fetchProviders = async () => {
        try {
            const res = await api.get('/super-admin/providers');
            setProviders(res.data);
        } catch (error) {
            console.error('Failed to fetch providers', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handleEdit = (provider: any) => {
        setEditingProvider(provider);
        setIsDialogOpen(true);
    };

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) setEditingProvider(null);
    };

    return (
        <AdminLayout>
            <div className={cn("space-y-8 p-2", PAGE_ANIMATION)}>
                <PageHeader
                    title="Configurações de LLM"
                    description="Gerencie os provedores de inteligência artificial e modelos disponíveis na plataforma"
                >
                    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => setEditingProvider(null)}
                                className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Provedor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingProvider ? 'Editar Provedor' : 'Adicionar Novo Provedor'}
                                </DialogTitle>
                            </DialogHeader>
                            <LLMProviderForm
                                initialData={editingProvider}
                                onSuccess={() => {
                                    fetchProviders();
                                    setIsDialogOpen(false);
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </PageHeader>

                <div className="grid gap-6">
                    <Card className="shadow-md border border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <div>
                                <CardTitle className="text-xl font-bold">Modelos de IA</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Gerencie chaves de API e configurações de modelos</p>
                            </div>
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Cpu className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                <LLMProviderTable
                                    providers={providers}
                                    onUpdate={fetchProviders}
                                    onEdit={handleEdit}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}

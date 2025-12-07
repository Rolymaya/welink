'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { LLMProviderTable } from '@/components/admin/llm-table';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LLMProviderForm } from '@/components/admin/llm-form';

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
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LLM Providers</h1>
                    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingProvider(null)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Provider
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>{editingProvider ? 'Edit Provider' : 'Add New Provider'}</DialogTitle>
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
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage AI Models</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div>Loading...</div>
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
        </AdminLayout>
    );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';

interface BankAccount {
    id: string;
    bankName: string;
    accountHolder: string;
    iban: string;
    swift?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function BankAccountsPage() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
    const [formData, setFormData] = useState({
        bankName: '',
        accountHolder: '',
        iban: '',
        swift: '',
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    async function loadAccounts() {
        try {
            const response = await api.get('/bank-accounts');
            setAccounts(response.data);
        } catch (error) {
            console.error('Error loading bank accounts:', error);
            toast.error('Erro ao carregar contas bancárias');
        } finally {
            setLoading(false);
        }
    }

    function openCreateDialog() {
        setEditingAccount(null);
        setFormData({ bankName: '', accountHolder: '', iban: '', swift: '' });
        setDialogOpen(true);
    }

    function openEditDialog(account: BankAccount) {
        setEditingAccount(account);
        setFormData({
            bankName: account.bankName,
            accountHolder: account.accountHolder,
            iban: account.iban,
            swift: account.swift || '',
        });
        setDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (editingAccount) {
                await api.patch(`/bank-accounts/${editingAccount.id}`, formData);
                toast.success('Conta bancária atualizada com sucesso!');
            } else {
                await api.post('/bank-accounts', formData);
                toast.success('Conta bancária criada com sucesso!');
            }
            setDialogOpen(false);
            loadAccounts();
        } catch (error) {
            console.error('Error saving bank account:', error);
            toast.error('Erro ao guardar conta bancária');
        }
    }

    async function toggleActive(id: string) {
        try {
            await api.patch(`/bank-accounts/${id}/toggle`);
            toast.success('Estado da conta atualizado!');
            loadAccounts();
        } catch (error) {
            console.error('Error toggling account:', error);
            toast.error('Erro ao atualizar estado da conta');
        }
    }

    async function deleteAccount(id: string) {
        if (!confirm('Tem certeza que deseja eliminar esta conta bancária?')) return;

        try {
            await api.delete(`/bank-accounts/${id}`);
            toast.success('Conta bancária eliminada!');
            loadAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Erro ao eliminar conta bancária');
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">A carregar...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Contas Bancárias</h1>
                        <p className="text-gray-500 mt-1">
                            Gerencie as contas bancárias para pagamentos de subscrições
                        </p>
                    </div>
                    <Button onClick={openCreateDialog} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nova Conta
                    </Button>
                </div>

                <div className="grid gap-4">
                    {accounts.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <p className="text-gray-500 mb-4">Nenhuma conta bancária cadastrada</p>
                                <Button onClick={openCreateDialog} variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar Primeira Conta
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        accounts.map((account) => (
                            <Card key={account.id} className="relative">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {account.bankName}
                                                <Badge variant={account.isActive ? 'default' : 'secondary'}>
                                                    {account.isActive ? 'Ativa' : 'Inativa'}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>{account.accountHolder}</CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => toggleActive(account.id)}
                                                title={account.isActive ? 'Desativar' : 'Ativar'}
                                            >
                                                {account.isActive ? (
                                                    <PowerOff className="h-4 w-4" />
                                                ) : (
                                                    <Power className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => openEditDialog(account)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => deleteAccount(account.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">IBAN:</span>
                                            <span className="font-mono">{account.iban}</span>
                                        </div>
                                        {account.swift && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">SWIFT/BIC:</span>
                                                <span className="font-mono">{account.swift}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
                            </DialogTitle>
                            <DialogDescription>
                                Preencha os dados da conta bancária para pagamentos
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Nome do Banco *</Label>
                                <Input
                                    id="bankName"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    placeholder="Ex: Banco BAI"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountHolder">Titular da Conta *</Label>
                                <Input
                                    id="accountHolder"
                                    value={formData.accountHolder}
                                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                                    placeholder="Ex: Wenova Geração Lda"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="iban">IBAN *</Label>
                                <Input
                                    id="iban"
                                    value={formData.iban}
                                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                                    placeholder="AO06..."
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="swift">SWIFT/BIC (Opcional)</Label>
                                <Input
                                    id="swift"
                                    value={formData.swift}
                                    onChange={(e) => setFormData({ ...formData, swift: e.target.value })}
                                    placeholder="BAIA..."
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    {editingAccount ? 'Atualizar' : 'Criar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}

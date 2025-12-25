'use client';
import { buildApiUrl } from '@/lib/apiUrl';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, DollarSign, TrendingUp, Check, X, Eye, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PageHeader, PAGE_ANIMATION } from '@/components/page-header';
import { cn } from '@/lib/utils';

interface GlobalStats {
    totalAffiliates: number;
    totalCompaniesReached: number;
    totalCommissionsPaid: number;
    pendingWithdrawalsAmount: number;
}

interface BankSnapshot {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    iban?: string;
    swift?: string;
}

interface WithdrawalRequest {
    id: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
    createdAt: string;
    description: string;
    bankSnapshot?: BankSnapshot;
    affiliateProfile: {
        organization: {
            id: string;
            name: string;
        };
    };
}

export default function AdminAffiliatesPage() {
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [commissionAmount, setCommissionAmount] = useState('');
    const [maxCommissions, setMaxCommissions] = useState('');
    const [saving, setSaving] = useState(false);

    // Modal State
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, withdrawalsRes] = await Promise.all([
                fetch(buildApiUrl('/admin/affiliates/stats'), { headers }),
                fetch(buildApiUrl('/admin/affiliates/withdrawals'), { headers }),
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (withdrawalsRes.ok) {
                const withdrawalsData = await withdrawalsRes.json();
                setWithdrawals(withdrawalsData);
            }
        } catch (error) {
            console.error('Error fetching affiliate data:', error);
            toast.error('Erro ao carregar dados de afiliados');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl('/subscriptions/settings'), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const settings = await response.json();
                setCommissionAmount(settings.affiliate_commission_amount || '10');
                setMaxCommissions(settings.affiliate_max_commissions || '3');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(buildApiUrl('/super-admin/settings'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ key: 'affiliate_commission_amount', value: commissionAmount }),
            });
            await fetch(buildApiUrl('/super-admin/settings'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ key: 'affiliate_max_commissions', value: maxCommissions }),
            });
            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleAction = async (action: 'approve' | 'complete' | 'reject') => {
        if (!selectedWithdrawal) return;
        setProcessingAction(true);

        try {
            const token = localStorage.getItem('token');
            const url = action === 'complete'
                ? `/admin/affiliates/withdrawals/${selectedWithdrawal.id}/complete`
                : `/admin/affiliates/withdrawals/${selectedWithdrawal.id}/${action}`;

            const response = await fetch(buildApiUrl(url), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: action === 'reject' ? JSON.stringify({ reason: 'Rejeitado pelo administrador' }) : undefined,
            });

            if (response.ok) {
                const messages = {
                    approve: 'Saque aprovado! Agora você pode realizar o pagamento.',
                    complete: 'Saque marcado como PAGO com sucesso!',
                    reject: 'Saque rejeitado.',
                };
                toast.success(messages[action]);
                setShowDetailsModal(false);
                fetchData();
            } else {
                toast.error('Erro ao processar ação');
            }
        } catch (error) {
            console.error('Error handling withdrawal:', error);
            toast.error('Erro ao processar ação');
        } finally {
            setProcessingAction(false);
        }
    };

    const openDetails = (withdrawal: WithdrawalRequest) => {
        setSelectedWithdrawal(withdrawal);
        setShowDetailsModal(true);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'PENDING': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
            case 'APPROVED': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Aprovado (Aguardando Pagamento)</Badge>;
            case 'COMPLETED': return <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>;
            case 'REJECTED': return <Badge variant="destructive">Rejeitado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <p>Carregando informações de afiliados...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className={cn("space-y-8 p-2", PAGE_ANIMATION)}>
                <PageHeader
                    title="Gestão de Afiliados"
                    description="Gerencie o programa de indicações, valide pedidos de saque e configure comissões"
                />

                {/* Global Stats Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border-purple-500/20 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Parceiros Afiliados</CardTitle>
                            <Users className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{stats?.totalAffiliates || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Empresas com programa ativo</p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-500/20 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Empresas Alcançadas</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats?.totalCompaniesReached || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total de empresas indicadas</p>
                        </CardContent>
                    </Card>

                    <Card className="border-green-500/20 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pago em Comissões</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(stats?.totalCommissionsPaid || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Valor total distribuído</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="withdrawals" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="withdrawals">Pedidos de Saque</TabsTrigger>
                        <TabsTrigger value="settings">Configurações</TabsTrigger>
                    </TabsList>

                    <TabsContent value="withdrawals" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pedidos de Saque</CardTitle>
                                <CardDescription>Gerencie os pedidos de saque. Primeiro aprove, depois realize o pagamento.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {withdrawals.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Nenhum pedido de saque pendente ou em processamento</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Empresa</TableHead>
                                                <TableHead>Valor</TableHead>
                                                <TableHead>Data do Pedido</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {withdrawals.map((withdrawal) => (
                                                <TableRow key={withdrawal.id}>
                                                    <TableCell className="font-medium">
                                                        {withdrawal.affiliateProfile.organization.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(withdrawal.amount)}
                                                    </TableCell>
                                                    <TableCell>{format(new Date(withdrawal.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={withdrawal.status} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openDetails(withdrawal)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Visualizar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações do Programa de Afiliados</CardTitle>
                                <CardDescription>Defina as regras de comissão e limites</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="commissionAmount">Percentagem da Comissão (%)</Label>
                                        <Input
                                            id="commissionAmount"
                                            type="number"
                                            value={commissionAmount}
                                            onChange={(e) => setCommissionAmount(e.target.value)}
                                            placeholder="10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="maxCommissions">Máximo de Comissões por Afiliado</Label>
                                        <Input
                                            id="maxCommissions"
                                            type="number"
                                            value={maxCommissions}
                                            onChange={(e) => setMaxCommissions(e.target.value)}
                                            placeholder="3"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={saveSettings}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Withdrawal Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Saque</DialogTitle>
                        <DialogDescription>
                            Verifique os dados bancários antes de aprovar ou pagar.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedWithdrawal && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <Label className="text-muted-foreground">Empresa Solicitante</Label>
                                    <p className="font-medium">{selectedWithdrawal.affiliateProfile.organization.name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Data do Pedido</Label>
                                    <p className="font-medium">{format(new Date(selectedWithdrawal.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Valor Solicitado</Label>
                                    <p className="text-lg font-bold text-green-600">
                                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(selectedWithdrawal.amount)}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status Atual</Label>
                                    <div className="mt-1"><StatusBadge status={selectedWithdrawal.status} /></div>
                                </div>
                            </div>

                            <div className="border rounded-md p-4 bg-muted/50 space-y-3">
                                <div className="flex items-center gap-2 mb-2 border-b pb-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <span className="font-semibold text-sm">Dados Bancários para Transferência</span>
                                </div>
                                {selectedWithdrawal.bankSnapshot ? (
                                    <div className="grid gap-2 text-sm">
                                        <div className="grid grid-cols-3">
                                            <span className="text-muted-foreground">Banco:</span>
                                            <span className="col-span-2 font-medium">{selectedWithdrawal.bankSnapshot.bankName}</span>
                                        </div>
                                        <div className="grid grid-cols-3">
                                            <span className="text-muted-foreground">Titular:</span>
                                            <span className="col-span-2 font-medium">{selectedWithdrawal.bankSnapshot.accountHolder}</span>
                                        </div>
                                        <div className="grid grid-cols-3">
                                            <span className="text-muted-foreground">Número:</span>
                                            <span className="col-span-2 font-mono bg-white px-1 rounded border">{selectedWithdrawal.bankSnapshot.accountNumber}</span>
                                        </div>
                                        {selectedWithdrawal.bankSnapshot.iban && (
                                            <div className="grid grid-cols-3">
                                                <span className="text-muted-foreground">IBAN:</span>
                                                <span className="col-span-2 font-mono text-xs">{selectedWithdrawal.bankSnapshot.iban}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-yellow-600 italic">
                                        Dados bancários não capturados neste pedido (Sistema Legacy).
                                        Verifique a descrição ou entre em contato com o afiliado.
                                    </p>
                                )}
                            </div>

                            {selectedWithdrawal.description && (
                                <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                                    Nota: {selectedWithdrawal.description}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end">
                        <Button variant="ghost" onClick={() => setShowDetailsModal(false)}>Fechar</Button>

                        {selectedWithdrawal?.status === 'PENDING' && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleAction('reject')}
                                    disabled={processingAction}
                                >
                                    Rejeitar
                                </Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleAction('approve')}
                                    disabled={processingAction}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Aprovar Pedido
                                </Button>
                            </>
                        )}

                        {selectedWithdrawal?.status === 'APPROVED' && (
                            <>
                                <Button
                                    variant="outline"
                                    className="text-red-500 hover:text-red-700 border-red-200"
                                    onClick={() => handleAction('reject')}
                                    disabled={processingAction}
                                >
                                    Cancelar e Devolver
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleAction('complete')}
                                    disabled={processingAction}
                                >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Marcar como Pago
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

'use client';
import { buildApiUrl } from '@/lib/apiUrl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Users, Copy, Check, ExternalLink, Lock, Plus, Trash2, Building, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PageHeader, PAGE_ANIMATION } from '@/components/page-header';
import { cn } from '@/lib/utils';

interface BankAccount {
    id: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    iban?: string;
    swift?: string;
}

interface AffiliateStats {
    profile: {
        referralCode: string;
        walletBalance: number;
        totalEarnings: number;
    };
    referrals: Array<{
        id: string;
        organizationName: string;
        registeredAt: string;
        activePackage: string;
        commissionCount: number;
        totalAmount: number;
        status: string;
    }>;
    transactions: Array<{
        id: string;
        type: string;
        amount: number;
        status: string;
        description: string | null;
        createdAt: string;
    }>;
    bankAccounts: BankAccount[];
}

export default function AffiliatesPage() {
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Withdrawal State
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawPassword, setWithdrawPassword] = useState('');
    const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    // Bank Account Management State
    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [bankForm, setBankForm] = useState({
        accountHolder: '',
        bankName: '',
        accountNumber: '',
        iban: '',
        swift: '',
    });
    const [savingBank, setSavingBank] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl('/affiliates/stats'), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
                // If there are accounts, select the first one by default for withdrawal
                if (data.bankAccounts && data.bankAccounts.length > 0) {
                    setSelectedBankAccountId(data.bankAccounts[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching affiliate stats:', error);
            toast.error('Erro ao carregar estatísticas de afiliados');
        } finally {
            setLoading(false);
        }
    };

    const copyReferralLink = () => {
        if (!stats) return;
        const link = `${window.location.origin}/auth/register?ref=${stats.profile.referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success('Link copiado para a área de transferência!');
        setTimeout(() => setCopied(false), 2000);
    };

    const requestWithdrawal = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            toast.error('Por favor, insira um valor válido');
            return;
        }

        if (!withdrawPassword) {
            toast.error('Por favor, confirme sua senha');
            return;
        }

        if (!selectedBankAccountId) {
            toast.error('Por favor, selecione uma conta bancária');
            return;
        }

        const amount = parseFloat(withdrawAmount);
        if (stats && amount > stats.profile.walletBalance) {
            toast.error('Saldo insuficiente');
            return;
        }

        setWithdrawing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl('/affiliates/withdraw'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount,
                    bankAccountId: selectedBankAccountId,
                    password: withdrawPassword
                }),
            });

            if (response.ok) {
                toast.success('Pedido de saque enviado com sucesso!');
                setWithdrawAmount('');
                setWithdrawPassword('');
                setShowWithdrawModal(false);
                fetchStats();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Erro ao solicitar saque');
            }
        } catch (error) {
            console.error('Error requesting withdrawal:', error);
            toast.error('Erro ao solicitar saque');
        } finally {
            setWithdrawing(false);
        }
    };

    const addBankAccount = async () => {
        if (!bankForm.accountHolder || !bankForm.bankName || !bankForm.accountNumber) {
            toast.error('Por favor, preencha os campos obrigatórios');
            return;
        }

        setSavingBank(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl('/affiliates/bank-account'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(bankForm),
            });

            if (response.ok) {
                toast.success('Conta bancária adicionada com sucesso!');
                setShowAddBankModal(false);
                // Reset form
                setBankForm({
                    accountHolder: '',
                    bankName: '',
                    accountNumber: '',
                    iban: '',
                    swift: '',
                });
                fetchStats();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Erro ao adicionar conta bancária');
            }
        } catch (error) {
            console.error('Error adding bank account:', error);
            toast.error('Erro ao adicionar conta bancária');
        } finally {
            setSavingBank(false);
        }
    };

    const deleteBankAccount = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conta bancária?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl(`/affiliates/bank-account/${id}`), {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                toast.success('Conta bancária removida com sucesso!');
                fetchStats();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Erro ao remover conta');
            }
        } catch (error) {
            console.error('Error deleting bank account:', error);
            toast.error('Erro ao remover conta');
        }
    };

    const getTransactionTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            COMMISSION_EARNED: 'Comissão Recebida',
            WITHDRAWAL_REQUEST: 'Pedido de Saque',
            WITHDRAWAL_COMPLETED: 'Saque Completado',
            WITHDRAWAL_REJECTED: 'Saque Rejeitado',
        };
        return labels[type] || type;
    };

    const getTransactionStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
            COMPLETED: 'default',
            PENDING: 'secondary',
            REJECTED: 'destructive',
        };
        return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p>Carregando informações de afiliados...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex justify-center items-center h-64">
                <p>Erro ao carregar dados de afiliados</p>
            </div>
        );
    }

    const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${stats.profile.referralCode}`;
    const hasBankAccounts = stats.bankAccounts && stats.bankAccounts.length > 0;

    return (
        <div className={cn("space-y-8", PAGE_ANIMATION)}>
            <PageHeader
                title="Programa de Afiliados"
                description="Ganhe comissões indicando novas empresas e acompanhe seus rendimentos"
            >
                <Button
                    onClick={() => setShowWithdrawModal(true)}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all duration-300"
                    disabled={stats.profile.walletBalance <= 0}
                >
                    <DollarSign className="mr-2 h-5 w-5" />
                    Solicitar Saque
                </Button>
            </PageHeader>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-purple-500/20 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(stats.profile.walletBalance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Disponível para saque</p>
                    </CardContent>
                </Card>

                <Card className="border-green-500/20 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Renda</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(stats.profile.totalEarnings)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Ganhos acumulados</p>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/20 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Parceiros Indicados</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.referrals.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Empresas que usaram seu link</p>
                    </CardContent>
                </Card>
            </div>

            {/* Referral Link Section */}
            <Card className="border-purple-500/20 shadow-sm">
                <CardHeader>
                    <CardTitle>Seu Link de Afiliado</CardTitle>
                    <CardDescription>Partilhe este link para ganhar comissões</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input value={referralLink} readOnly className="font-mono text-sm" />
                        <Button onClick={copyReferralLink} variant="outline" className="shrink-0">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copiado' : 'Copiar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for Affiliates, Transactions, and Bank Accounts */}
            <Tabs defaultValue="affiliates" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="affiliates">Meus Afiliados</TabsTrigger>
                    <TabsTrigger value="transactions">Transações</TabsTrigger>
                    <TabsTrigger value="bank">Contas Bancárias</TabsTrigger>
                </TabsList>

                <TabsContent value="affiliates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Empresas Indicadas</CardTitle>
                            <CardDescription>Lista de todas as empresas que se registaram com o seu link</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stats.referrals.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Ainda não tem afiliados</p>
                                    <p className="text-sm">Partilhe o seu link para começar a ganhar comissões</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Empresa</TableHead>
                                            <TableHead>Data de Registo</TableHead>
                                            <TableHead>Pacote Ativo</TableHead>
                                            <TableHead>Total em Comissões</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.referrals.map((referral) => (
                                            <TableRow key={referral.id}>
                                                <TableCell className="font-medium">{referral.organizationName}</TableCell>
                                                <TableCell>{format(new Date(referral.registeredAt), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{referral.activePackage}</TableCell>
                                                <TableCell className="font-medium text-green-600">
                                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(referral.totalAmount || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={referral.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                        {referral.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Transações</CardTitle>
                            <CardDescription>Comissões recebidas e saques solicitados</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stats.transactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma transação ainda</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Data</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.transactions.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell className="font-medium">{getTransactionTypeLabel(transaction.type)}</TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(transaction.amount)}
                                                </TableCell>
                                                <TableCell>{getTransactionStatusBadge(transaction.status)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{transaction.description || '-'}</TableCell>
                                                <TableCell>{format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bank" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-semibold tracking-tight">Suas Contas Bancárias</h2>
                            <p className="text-sm text-muted-foreground">Gerencie as contas onde receberá seus saques</p>
                        </div>
                        <Button onClick={() => setShowAddBankModal(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Conta
                        </Button>
                    </div>

                    {!hasBankAccounts ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50">
                            <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Nenhuma conta cadastrada</h3>
                            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                                Adicione uma conta bancária para poder solicitar saques das suas comissões.
                            </p>
                            <Button onClick={() => setShowAddBankModal(true)} variant="outline">
                                Adicionar Agora
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {stats.bankAccounts.map((account) => (
                                <Card key={account.id} className="relative overflow-hidden transition-all hover:border-primary/50">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    {account.bankName}
                                                </CardTitle>
                                                <CardDescription className="font-mono text-xs">
                                                    {account.accountNumber}
                                                </CardDescription>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                                onClick={() => deleteBankAccount(account.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-1 pb-4">
                                        <p><span className="text-muted-foreground">Titular:</span> <span className="font-medium">{account.accountHolder}</span></p>
                                        {account.iban && <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono text-xs">{account.iban}</span></p>}
                                    </CardContent>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <DollarSign className="h-24 w-24" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Add Bank Account Modal */}
            <Dialog open={showAddBankModal} onOpenChange={setShowAddBankModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Nova Conta Bancária</DialogTitle>
                        <DialogDescription>
                            Preencha os dados abaixo para cadastrar uma nova conta para saques.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Banco *</label>
                            <Input
                                placeholder="Ex: Banco BAI"
                                value={bankForm.bankName}
                                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Titular da Conta *</label>
                            <Input
                                placeholder="Nome completo do titular"
                                value={bankForm.accountHolder}
                                onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Número da Conta *</label>
                            <Input
                                placeholder="Número da conta"
                                value={bankForm.accountNumber}
                                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">IBAN (Opcional)</label>
                                <Input
                                    placeholder="AO06..."
                                    value={bankForm.iban}
                                    onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">SWIFT (Opcional)</label>
                                <Input
                                    placeholder="SWIFT Code"
                                    value={bankForm.swift}
                                    onChange={(e) => setBankForm({ ...bankForm, swift: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddBankModal(false)}>Cancelar</Button>
                        <Button onClick={addBankAccount} disabled={savingBank}>
                            {savingBank ? 'Salvando...' : 'Adicionar Conta'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Withdrawal Modal */}
            <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Solicitar Saque</DialogTitle>
                        <DialogDescription>
                            Transfira seu saldo disponível para sua conta bancária.
                        </DialogDescription>
                    </DialogHeader>

                    {hasBankAccounts ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Conta de Destino</label>
                                <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma conta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stats?.bankAccounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.bankName} - {account.accountNumber}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Valor a Sacar (Disponível: {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(stats?.profile.walletBalance || 0)})</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        className="pl-9"
                                        placeholder="0.00"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirme sua Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        className="pl-9"
                                        placeholder="Sua senha de login"
                                        value={withdrawPassword}
                                        onChange={(e) => setWithdrawPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-center space-y-4">
                            <Building className="h-12 w-12 mx-auto text-yellow-500 opacity-50" />
                            <p>Você precisa adiconar uma conta bancária antes de solicitar um saque.</p>
                            <Button variant="outline" onClick={() => { setShowWithdrawModal(false); setShowAddBankModal(true); }}>
                                Adicionar Conta Bancária
                            </Button>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowWithdrawModal(false)}>Cancelar</Button>
                        {hasBankAccounts && (
                            <Button
                                onClick={requestWithdrawal}
                                disabled={withdrawing || !withdrawAmount || !withdrawPassword || !selectedBankAccountId}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {withdrawing ? 'Processando...' : 'Confirmar Saque'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

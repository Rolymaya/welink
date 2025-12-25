'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BusinessHoursSelector } from '@/components/business-hours-selector';
import { Building2, Clock, FileText, Bell, Plug, Users, CreditCard, Save, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader, PAGE_ANIMATION } from '@/components/page-header';
import { cn } from '@/lib/utils';

interface Organization {
    id: string;
    name: string;
    logo: string | null;
    sector: string | null;
    description: string | null;
    businessHours: any;
    privacyPolicy: string | null;
    termsOfService: string | null;
    returnPolicy: string | null;
}

export default function SettingsPage() {
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [sector, setSector] = useState('');
    const [description, setDescription] = useState('');
    const [privacyPolicy, setPrivacyPolicy] = useState('');
    const [termsOfService, setTermsOfService] = useState('');
    const [returnPolicy, setReturnPolicy] = useState('');
    const [businessHours, setBusinessHours] = useState({
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '09:00', close: '13:00', isOpen: true },
        sunday: { open: '09:00', close: '18:00', isOpen: false },
    });

    // Bank Account States
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
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
        loadOrganization();
        loadBankAccounts();
    }, []);

    async function loadBankAccounts() {
        try {
            // Use local API wrapper or fetch directly
            const response = await api.get('/affiliates/bank-accounts');
            setBankAccounts(response.data);
        } catch (error) {
            console.error('Error loading bank accounts:', error);
            // toast.error('Erro ao carregar contas bancárias'); // Optional, maybe silence initial load error if empty
        }
    }

    async function addBankAccount() {
        if (!bankForm.accountHolder || !bankForm.bankName || !bankForm.iban) {
            toast.error('Preencha os campos obrigatórios (Banco, Titular, IBAN)');
            return;
        }

        setSavingBank(true);
        try {
            await api.post('/affiliates/bank-account', {
                ...bankForm
            });
            toast.success('Conta bancária adicionada!');
            setShowAddBankModal(false);
            setBankForm({
                accountHolder: '',
                bankName: '',
                accountNumber: '',
                iban: '',
                swift: '',
            });
            loadBankAccounts();
        } catch (error) {
            console.error('Error adding bank account:', error);
            toast.error('Erro ao adicionar conta');
        } finally {
            setSavingBank(false);
        }
    }

    async function deleteBankAccount(id: string) {
        if (!confirm('Tem certeza?')) return;
        try {
            await api.delete(`/affiliates/bank-account/${id}`);
            toast.success('Conta removida.');
            loadBankAccounts();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Erro ao remover conta');
        }
    }

    async function loadOrganization() {
        try {
            const response = await api.get('/organization/profile');
            setOrg(response.data);
            setName(response.data.name || '');
            setSector(response.data.sector || '');
            setDescription(response.data.description || '');
            setPrivacyPolicy(response.data.privacyPolicy || '');
            setTermsOfService(response.data.termsOfService || '');
            setReturnPolicy(response.data.returnPolicy || '');
            if (response.data.businessHours) {
                setBusinessHours(response.data.businessHours);
            }
        } catch (error) {
            console.error('Error loading organization:', error);
            toast.error('Erro ao carregar dados da organização');
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveProfile() {
        setSaving(true);
        try {
            await api.patch('/organization/profile', {
                name,
                sector,
                description
            });
            toast.success('Perfil atualizado com sucesso!');
            loadOrganization();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    }

    async function handleSavePolicies() {
        setSaving(true);
        try {
            await api.patch('/organization/profile', {
                privacyPolicy,
                termsOfService,
                returnPolicy
            });
            toast.success('Políticas atualizadas com sucesso!');
            loadOrganization();
        } catch (error) {
            console.error('Error updating policies:', error);
            toast.error('Erro ao atualizar políticas');
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveBusinessHours() {
        setSaving(true);
        try {
            await api.patch('/organization/profile', {
                businessHours
            });
            toast.success('Horários atualizados com sucesso!');
            loadOrganization();
        } catch (error) {
            console.error('Error updating business hours:', error);
            toast.error('Erro ao atualizar horários');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">A carregar...</div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-8", PAGE_ANIMATION)}>
            <PageHeader
                title="Configurações"
                description="Gerencie as configurações da sua organização, horários e políticas"
            />

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7 lg:w-auto">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Perfil</span>
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">Dados Bancários</span>
                    </TabsTrigger>
                    <TabsTrigger value="hours" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Horários</span>
                    </TabsTrigger>
                    <TabsTrigger value="policies" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Políticas</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notificações</span>
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="flex items-center gap-2">
                        <Plug className="h-4 w-4" />
                        <span className="hidden sm:inline">Integrações</span>
                    </TabsTrigger>
                    <TabsTrigger value="team" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Equipa</span>
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                    <Card className="relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
                        <CardHeader>
                            <CardTitle>Perfil da Empresa</CardTitle>
                            <CardDescription>Informações básicas sobre a sua organização</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Empresa</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nome da sua empresa"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sector">Setor/Indústria</Label>
                                <Input
                                    id="sector"
                                    value={sector}
                                    onChange={(e) => setSector(e.target.value)}
                                    placeholder="Ex: Tecnologia, Varejo, Saúde"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Breve descrição da sua empresa"
                                    rows={4}
                                />
                            </div>
                            <Button onClick={handleSaveProfile} disabled={saving}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'A guardar...' : 'Guardar Alterações'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Bank Accounts Tab */}
                <TabsContent value="bank" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold tracking-tight">Contas Bancárias</h2>
                            <p className="text-sm text-muted-foreground">Gerencie as contas usadas pelo Agente para pagamentos.</p>
                        </div>
                        <Button onClick={() => setShowAddBankModal(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Conta
                        </Button>
                    </div>

                    {bankAccounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50">
                            <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Nenhuma conta cadastrada</h3>
                            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                                Adicione uma conta bancária para que o Agente possa fornecer dados de pagamento.
                            </p>
                            <Button onClick={() => setShowAddBankModal(true)} variant="outline">
                                Adicionar Agora
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {bankAccounts.map((account) => (
                                <Card key={account.id} className="relative overflow-hidden transition-all hover:border-primary/50">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
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
                                        <Building2 className="h-24 w-24" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Other Tabs... */}
                <TabsContent value="hours" className="space-y-4">
                    <Card className="relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
                        <CardHeader>
                            <CardTitle>Horário de Atendimento</CardTitle>
                            <CardDescription>Defina quando os seus agentes devem responder</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <BusinessHoursSelector value={businessHours} onChange={setBusinessHours} />
                            <Button onClick={handleSaveBusinessHours} disabled={saving}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'A guardar...' : 'Guardar Horários'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Policies, Notifications, etc... - Reusing existing content below */}
                <TabsContent value="policies" className="space-y-4">
                    <Card className="relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
                        <CardHeader>
                            <CardTitle>Políticas e Termos</CardTitle>
                            <CardDescription>Documentos legais da sua empresa</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="privacy">Política de Privacidade</Label>
                                <Textarea
                                    id="privacy"
                                    value={privacyPolicy}
                                    onChange={(e) => setPrivacyPolicy(e.target.value)}
                                    placeholder="Política de privacidade da sua empresa..."
                                    rows={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="terms">Termos de Serviço</Label>
                                <Textarea
                                    id="terms"
                                    value={termsOfService}
                                    onChange={(e) => setTermsOfService(e.target.value)}
                                    placeholder="Termos de serviço da sua empresa..."
                                    rows={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="return">Política de Devolução</Label>
                                <Textarea
                                    id="return"
                                    value={returnPolicy}
                                    onChange={(e) => setReturnPolicy(e.target.value)}
                                    placeholder="Política de devolução da sua empresa..."
                                    rows={6}
                                />
                            </div>
                            <Button onClick={handleSavePolicies} disabled={saving}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'A guardar...' : 'Guardar Políticas'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card className="relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Preferências de Notificações</CardTitle>
                                    <CardDescription>Configure como deseja ser notificado</CardDescription>
                                </div>
                                <Badge variant="secondary">Em Breve</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 opacity-50">
                            <p className="text-sm text-gray-500">
                                Configure notificações por email, alertas de sessão e relatórios automáticos.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-4">
                    <Card className="relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Integrações</CardTitle>
                                    <CardDescription>Conecte com outras ferramentas</CardDescription>
                                </div>
                                <Badge variant="secondary">Em Breve</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 opacity-50">
                            <p className="text-sm text-gray-500">
                                API Keys, Webhooks e integrações com CRM estarão disponíveis em breve.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                    <Card className="relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Gestão de Equipa</CardTitle>
                                    <CardDescription>Adicione e gerencie membros da equipa</CardDescription>
                                </div>
                                <Badge variant="secondary">Em Breve</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 opacity-50">
                            <p className="text-sm text-gray-500">
                                Adicione membros, defina permissões e gerencie acessos à plataforma.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4">
                    <Card className="relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Plano e Faturação</CardTitle>
                                    <CardDescription>Gerencie o seu plano e pagamentos</CardDescription>
                                </div>
                                <Badge variant="secondary">Em Breve</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 opacity-50">
                            <p className="text-sm text-gray-500">
                                Visualize seu plano atual, uso de recursos e histórico de pagamentos.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
            {/* Add Bank Account Modal - Simplified inline */}
            {/* Add Bank Account Modal */}
            <Dialog open={showAddBankModal} onOpenChange={setShowAddBankModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Nova Conta Bancária</DialogTitle>
                        <DialogDescription>
                            Preencha os dados abaixo para cadastrar uma nova conta.
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
        </div>
    );
}

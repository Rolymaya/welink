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
import { Building2, Clock, FileText, Bell, Plug, Users, CreditCard, Save } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

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

    useEffect(() => {
        loadOrganization();
    }, []);

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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Configurações</h1>
                <p className="text-gray-500 mt-2">Gerencie as configurações da sua organização</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7 lg:w-auto">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Perfil</span>
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
                    <TabsTrigger value="billing" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">Faturação</span>
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

                {/* Business Hours Tab */}
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

                {/* Policies Tab */}
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

                {/* Notifications Tab */}
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

                {/* Integrations Tab */}
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

                {/* Team Tab */}
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

                {/* Billing Tab */}
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
        </div>
    );
}

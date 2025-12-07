'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Save, User, Mail, FlaskConical, Clock, ChevronDown } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [settings, setSettings] = useState<any>({
        SMTP_HOST: '',
        SMTP_PORT: '',
        SMTP_USER: '',
        SMTP_PASS: '',
        SMTP_FROM: '',
        SMTP_SECURE: 'false',
        PLAYGROUND_MAX_AGENTS_PER_ORG: '1',
        PLAYGROUND_DAILY_MSG_LIMIT: '200',
        PLAYGROUND_RETENTION_DAYS: '7',
        PLAYGROUND_CLEANUP_SCHEDULE: '0 3 * * *',
        SUBSCRIPTION_EXPIRATION_SCHEDULE: '0 1 * * *'
    });
    const [profile, setProfile] = useState<any>({
        email: '',
        phone: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        loadSettings();
        loadProfile();
    }, []);

    async function loadSettings() {
        try {
            const response = await api.get('/super-admin/settings');
            setSettings((prev: any) => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    }

    async function loadProfile() {
        try {
            const response = await api.get('/auth/profile');
            setProfile({
                email: response.data.email || '',
                phone: response.data.phone || '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/super-admin/settings', settings);
            toast.success('Configurações guardadas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Erro ao guardar configurações');
        } finally {
            setSaving(false);
        }
    }

    async function handleProfileSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        setSavingProfile(true);
        try {
            const updateData: any = {
                email: profile.email,
                phone: profile.phone
            };

            if (profile.newPassword) {
                updateData.password = profile.newPassword;
            }

            await api.post('/auth/profile', updateData);
            toast.success('Perfil atualizado com sucesso!');

            // Clear password fields
            setProfile({ ...profile, newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil');
        } finally {
            setSavingProfile(false);
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
                <div>
                    <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
                    <p className="text-gray-500 mt-1">
                        Gerencie as configurações globais da plataforma
                    </p>
                </div>

                <div className="space-y-4">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {/* Configurações Gerais do Perfil */}
                        <AccordionItem value="profile" className="border rounded-lg px-6 bg-white shadow-sm">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-primary" />
                                    <div className="text-left">
                                        <h3 className="font-semibold text-base">Configurações Gerais</h3>
                                        <p className="text-sm text-gray-500 font-normal">
                                            Atualize seu email, telefone e senha
                                        </p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 pt-2">
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                placeholder="admin@exemplo.com"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                placeholder="+244 900 000 000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">Nova Senha (Opcional)</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                value={profile.newPassword}
                                                onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={profile.confirmPassword}
                                                onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" disabled={savingProfile}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {savingProfile ? 'A guardar...' : 'Guardar Perfil'}
                                        </Button>
                                    </div>
                                </form>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {/* Configurações de Email (SMTP) */}
                            <AccordionItem value="smtp" className="border rounded-lg px-6 bg-white shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-primary" />
                                        <div className="text-left">
                                            <h3 className="font-semibold text-base">Configurações de Email (SMTP)</h3>
                                            <p className="text-sm text-gray-500 font-normal">
                                                Servidor de email para notificações e recuperação de senha
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6 pt-2">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="SMTP_HOST">Servidor SMTP (Host)</Label>
                                            <Input
                                                id="SMTP_HOST"
                                                value={settings.SMTP_HOST || ''}
                                                onChange={(e) => setSettings({ ...settings, SMTP_HOST: e.target.value })}
                                                placeholder="smtp.exemplo.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="SMTP_PORT">Porta SMTP</Label>
                                            <Input
                                                id="SMTP_PORT"
                                                value={settings.SMTP_PORT || ''}
                                                onChange={(e) => setSettings({ ...settings, SMTP_PORT: e.target.value })}
                                                placeholder="587"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="SMTP_USER">Usuário SMTP</Label>
                                            <Input
                                                id="SMTP_USER"
                                                value={settings.SMTP_USER || ''}
                                                onChange={(e) => setSettings({ ...settings, SMTP_USER: e.target.value })}
                                                placeholder="email@exemplo.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="SMTP_PASS">Senha SMTP</Label>
                                            <Input
                                                id="SMTP_PASS"
                                                type="password"
                                                value={settings.SMTP_PASS || ''}
                                                onChange={(e) => setSettings({ ...settings, SMTP_PASS: e.target.value })}
                                                placeholder="********"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="SMTP_FROM">Email de Remetente</Label>
                                            <Input
                                                id="SMTP_FROM"
                                                value={settings.SMTP_FROM || ''}
                                                onChange={(e) => setSettings({ ...settings, SMTP_FROM: e.target.value })}
                                                placeholder='"WeLinkAI" <noreply@welink.ai>'
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="SMTP_SECURE">Seguro (SSL/TLS)</Label>
                                            <select
                                                id="SMTP_SECURE"
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={settings.SMTP_SECURE || 'false'}
                                                onChange={(e) => setSettings({ ...settings, SMTP_SECURE: e.target.value })}
                                            >
                                                <option value="false">Não (False)</option>
                                                <option value="true">Sim (True)</option>
                                            </select>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Configurações do Playground */}
                            <AccordionItem value="playground" className="border rounded-lg px-6 bg-white shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <FlaskConical className="h-5 w-5 text-primary" />
                                        <div className="text-left">
                                            <h3 className="font-semibold text-base">Configurações do Playground</h3>
                                            <p className="text-sm text-gray-500 font-normal">
                                                Limites e agendamento para agentes de teste gratuitos
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6 pt-2">
                                    <div className="space-y-6">
                                        {/* Limites */}
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="PLAYGROUND_MAX_AGENTS_PER_ORG">
                                                    Máx. Agentes por Empresa
                                                </Label>
                                                <Input
                                                    id="PLAYGROUND_MAX_AGENTS_PER_ORG"
                                                    type="number"
                                                    min="0"
                                                    value={settings.PLAYGROUND_MAX_AGENTS_PER_ORG}
                                                    onChange={(e) => setSettings({ ...settings, PLAYGROUND_MAX_AGENTS_PER_ORG: e.target.value })}
                                                    placeholder="1"
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Quantos agentes de teste cada empresa pode criar
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="PLAYGROUND_DAILY_MSG_LIMIT">
                                                    Limite Diário de Mensagens
                                                </Label>
                                                <Input
                                                    id="PLAYGROUND_DAILY_MSG_LIMIT"
                                                    type="number"
                                                    min="0"
                                                    value={settings.PLAYGROUND_DAILY_MSG_LIMIT}
                                                    onChange={(e) => setSettings({ ...settings, PLAYGROUND_DAILY_MSG_LIMIT: e.target.value })}
                                                    placeholder="200"
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Mensagens de teste por dia por empresa
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="PLAYGROUND_RETENTION_DAYS">
                                                    Dias de Retenção
                                                </Label>
                                                <Input
                                                    id="PLAYGROUND_RETENTION_DAYS"
                                                    type="number"
                                                    min="1"
                                                    value={settings.PLAYGROUND_RETENTION_DAYS}
                                                    onChange={(e) => setSettings({ ...settings, PLAYGROUND_RETENTION_DAYS: e.target.value })}
                                                    placeholder="7"
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Dias antes de deletar dados antigos
                                                </p>
                                            </div>
                                        </div>

                                        {/* Agendamento de Limpeza */}
                                        <div className="space-y-4 pt-4 border-t">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-primary" />
                                                <h4 className="font-semibold text-sm">Agendamento de Limpeza</h4>
                                            </div>
                                            <p className="text-xs text-gray-500">Configure quando os dados antigos devem ser removidos automaticamente</p>

                                            <div className="space-y-2">
                                                <Label htmlFor="PLAYGROUND_CLEANUP_SCHEDULE">
                                                    Expressão Cron
                                                </Label>
                                                <Input
                                                    id="PLAYGROUND_CLEANUP_SCHEDULE"
                                                    value={settings.PLAYGROUND_CLEANUP_SCHEDULE || '0 3 * * *'}
                                                    onChange={(e) => setSettings({ ...settings, PLAYGROUND_CLEANUP_SCHEDULE: e.target.value })}
                                                    placeholder="0 3 * * *"
                                                />
                                                <div className="text-xs text-gray-500 space-y-1">
                                                    <p className="font-medium">Exemplos comuns:</p>
                                                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                                                        <li><code className="bg-gray-100 px-1 rounded">0 * * * *</code> - A cada hora</li>
                                                        <li><code className="bg-gray-100 px-1 rounded">0 */6 * * *</code> - A cada 6 horas</li>
                                                        <li><code className="bg-gray-100 px-1 rounded">0 3 * * *</code> - Diariamente às 3h (padrão)</li>
                                                        <li><code className="bg-gray-100 px-1 rounded">0 0 * * 0</code> - Semanalmente aos domingos</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Configurações de Subscrições */}
                            <AccordionItem value="subscriptions" className="border rounded-lg px-6 bg-white shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-primary" />
                                        <div className="text-left">
                                            <h3 className="font-semibold text-base">Configurações de Subscrições</h3>
                                            <p className="text-sm text-gray-500 font-normal">
                                                Agendamento automático de expiração de planos
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6 pt-2">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <h4 className="font-semibold text-sm">Expiração Automática</h4>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Configure quando o sistema deve verificar e marcar subscrições expiradas como EXPIRED
                                        </p>

                                        <div className="space-y-2">
                                            <Label htmlFor="SUBSCRIPTION_EXPIRATION_SCHEDULE">
                                                Expressão Cron
                                            </Label>
                                            <Input
                                                id="SUBSCRIPTION_EXPIRATION_SCHEDULE"
                                                value={settings.SUBSCRIPTION_EXPIRATION_SCHEDULE || '0 1 * * *'}
                                                onChange={(e) => setSettings({ ...settings, SUBSCRIPTION_EXPIRATION_SCHEDULE: e.target.value })}
                                                placeholder="0 1 * * *"
                                            />
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <p className="font-medium">Exemplos comuns:</p>
                                                <ul className="list-disc list-inside space-y-0.5 ml-2">
                                                    <li><code className="bg-gray-100 px-1 rounded">0 1 * * *</code> - Diariamente à 1h (padrão)</li>
                                                    <li><code className="bg-gray-100 px-1 rounded">0 */6 * * *</code> - A cada 6 horas</li>
                                                    <li><code className="bg-gray-100 px-1 rounded">0 0 * * *</code> - Diariamente à meia-noite</li>
                                                    <li><code className="bg-gray-100 px-1 rounded">*/30 * * * *</code> - A cada 30 minutos (teste)</li>
                                                </ul>
                                                <p className="text-amber-600 font-medium mt-2">
                                                    ⚠️ Ao salvar, o cron job será reiniciado automaticamente com a nova frequência.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Botão de Salvar Configurações do Sistema */}
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={saving} size="lg">
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'A guardar...' : 'Guardar Configurações do Sistema'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout >
    );
}

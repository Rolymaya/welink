'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Smartphone, RefreshCw, Trash2, CheckCircle2, XCircle, Clock, QrCode as QrCodeIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionRequiredOverlay from '@/components/subscription-required-overlay';
import LimitReachedOverlay from '@/components/limit-reached-overlay';
import { PageHeader, PAGE_ANIMATION } from '@/components/page-header';
import { cn } from '@/lib/utils';

interface Agent {
    id: string;
    name: string;
}

interface Session {
    id: string;
    status: 'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATED' | 'CONNECTED';
    qrCode?: string;
    agent: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

const STATUS_CONFIG = {
    DISCONNECTED: { label: 'Desconectado', color: 'bg-gray-500', icon: XCircle },
    QR_READY: { label: 'Aguardando QR', color: 'bg-yellow-500', icon: QrCodeIcon },
    AUTHENTICATED: { label: 'Autenticado', color: 'bg-blue-500', icon: Clock },
    CONNECTED: { label: 'Conectado', color: 'bg-green-500', icon: CheckCircle2 },
};

export default function WhatsAppPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [creating, setCreating] = useState(false);
    const { hasActiveSubscription, subscription, loading: subscriptionLoading } = useSubscription();
    const [showNoSubscriptionModal, setShowNoSubscriptionModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [usage, setUsage] = useState<any>(null);

    useEffect(() => {
        loadData();
        loadUsage();
    }, []);

    async function loadUsage() {
        try {
            const response = await api.get('/subscriptions/usage');
            setUsage(response.data);
        } catch (error) {
            console.error('Error loading usage:', error);
        }
    }

    function handleCreateClick() {
        // Check if has subscription
        if (!hasActiveSubscription) {
            setShowNoSubscriptionModal(true);
            return;
        }

        // Check if reached limit
        if (usage && subscription) {
            console.log('Subscription data:', subscription);
            console.log('Package data:', subscription.package);
            console.log('Max sessions:', subscription.package?.maxSessions);
            console.log('Current usage:', usage.sessions);

            const limit = subscription.package?.maxSessions || 0;
            if (usage.sessions >= limit) {
                console.log('Limit reached! Showing modal');
                setShowLimitModal(true);
                return;
            }
        }

        // Only open dialog if checks pass
        setCreateDialogOpen(true);
    }

    // Auto-refresh sessions with QR_READY status
    useEffect(() => {
        const hasQrReady = sessions.some(s => s.status === 'QR_READY');
        if (!hasQrReady) return;

        const interval = setInterval(() => {
            loadSessions();
        }, 3000);

        return () => clearInterval(interval);
    }, [sessions]);

    async function loadData() {
        try {
            await Promise.all([loadSessions(), loadAgents()]);
        } finally {
            setLoading(false);
        }
    }

    async function loadSessions() {
        try {
            const response = await api.get('/whatsapp/sessions');
            setSessions(response.data);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    async function loadAgents() {
        try {
            const response = await api.get('/agents');
            setAgents(response.data);
        } catch (error) {
            console.error('Error loading agents:', error);
            toast.error(`Erro ao carregar agentes: ${(error as any).message}`);
        }
    }

    async function handleCreateSession() {
        if (!selectedAgentId) {
            toast.error('Selecione um agente');
            return;
        }

        setCreating(true);
        try {
            await api.post('/whatsapp/session/create', { agentId: selectedAgentId });
            toast.success('Sessão criada! Aguarde o QR Code...');
            setCreateDialogOpen(false);
            setSelectedAgentId('');
            setTimeout(loadSessions, 2000); // Wait for QR generation
        } catch (error) {
            console.error('Error creating session:', error);
            toast.error('Erro ao criar sessão');
        } finally {
            setCreating(false);
        }
    }

    async function handleReconnect(sessionId: string) {
        try {
            await api.post(`/whatsapp/session/${sessionId}/start`);
            toast.success('Reconexão iniciada! Aguarde o QR Code...');
            setTimeout(loadSessions, 2000);
        } catch (error) {
            console.error('Error reconnecting:', error);
            toast.error('Erro ao reconectar');
        }
    }

    async function handleDisconnect(sessionId: string) {
        try {
            await api.post(`/whatsapp/session/${sessionId}/disconnect`);
            toast.success('Sessão desconectada com sucesso');
            loadSessions();
        } catch (error) {
            console.error('Error disconnecting:', error);
            toast.error('Erro ao desconectar sessão');
        }
    }

    async function handleDelete(sessionId: string) {
        if (!confirm('Tem certeza que deseja eliminar esta sessão?')) return;

        try {
            await api.delete(`/whatsapp/session/${sessionId}`);
            toast.success('Sessão eliminada com sucesso');
            loadSessions();
        } catch (error) {
            console.error('Error deleting session:', error);
            toast.error('Erro ao eliminar sessão');
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
            <SubscriptionRequiredOverlay show={showNoSubscriptionModal} />
            <LimitReachedOverlay
                show={showLimitModal}
                resourceType="sessões"
                currentLimit={subscription?.package?.maxSessions || 0}
                onClose={() => setShowLimitModal(false)}
            />
            
            <PageHeader
                title="Conexões WhatsApp"
                description="Gerencie as conexões WhatsApp dos seus agentes e acompanhe o status em tempo real"
            >
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <Button onClick={handleCreateClick} size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                        <Plus className="mr-2 h-5 w-5" />
                        Nova Conexão
                    </Button>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Nova Conexão WhatsApp</DialogTitle>
                            <DialogDescription>
                                Selecione um agente para conectar ao WhatsApp
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um agente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agents.map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCreateSession} disabled={creating || !selectedAgentId}>
                                {creating ? 'A criar...' : 'Criar Sessão'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageHeader>

            {agents.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Smartphone className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum agente disponível</h3>
                        <p className="text-gray-500 text-center mb-4">
                            Crie um agente primeiro para poder conectar ao WhatsApp
                        </p>
                        <Button onClick={() => window.location.href = '/company/agents/create'}>
                            Criar Agente
                        </Button>
                    </CardContent>
                </Card>
            ) : sessions.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Smartphone className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhuma conexão criada</h3>
                        <p className="text-gray-500 text-center mb-4">
                            Crie uma conexão WhatsApp para começar a automatizar o atendimento
                        </p>
                        <Button onClick={() => window.location.href = '/company/agents/create'}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Primeira Conexão
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {sessions.map((session) => {
                        const statusConfig = STATUS_CONFIG[session.status];
                        const StatusIcon = statusConfig.icon;

                        return (
                            <Card key={session.id} className="relative">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Smartphone className="h-5 w-5 text-primary" />
                                            <div>
                                                <CardTitle className="text-lg">{session.agent.name}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    Criado em {new Date(session.createdAt).toLocaleDateString('pt-PT')}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className={`${statusConfig.color} text-white`}>
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {statusConfig.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {session.status === 'QR_READY' && session.qrCode && (
                                        <div className="flex flex-col items-center space-y-3 p-4 bg-white rounded-lg border-2 border-dashed">
                                            <p className="text-sm font-medium text-center">
                                                Escaneie este QR Code com o WhatsApp
                                            </p>
                                            {session.qrCode.startsWith('data:image') ? (
                                                // Old format: Data URL - show as image
                                                <img src={session.qrCode} alt="QR Code" className="w-[200px] h-[200px]" />
                                            ) : (
                                                // New format: Text - render with QRCodeSVG
                                                <QRCodeSVG value={session.qrCode} size={200} />
                                            )}
                                            <p className="text-xs text-gray-500 text-center">
                                                Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
                                            </p>
                                        </div>
                                    )}

                                    {session.status === 'CONNECTED' && (
                                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                            <p className="text-sm text-green-800 font-medium">
                                                ✓ WhatsApp conectado e pronto para receber mensagens
                                            </p>
                                        </div>
                                    )}

                                    {session.status === 'DISCONNECTED' && (
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="text-sm text-gray-600">
                                                Conexão desconectada. Clique em reconectar para gerar um novo QR Code.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex space-x-2">
                                        {(session.status === 'DISCONNECTED' || session.status === 'QR_READY') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleReconnect(session.id)}
                                            >
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Reconectar
                                            </Button>
                                        )}
                                        {session.status === 'CONNECTED' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                onClick={() => handleDisconnect(session.id)}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Desconectar
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(session.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

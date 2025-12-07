'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, FlaskConical, MessageCircle, Sparkles, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import PlaygroundQRDisplay from '@/components/playground-qr-display';

export default function PlaygroundAgentsPage() {
    const router = useRouter();
    const [agents, setAgents] = useState<any[]>([]);
    const [limits, setLimits] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<Record<string, string>>({}); // agentId -> sessionId

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [agentsRes, limitsRes, sessionsRes] = await Promise.all([
                api.get('/playground/agents'),
                api.get('/playground/limits'),
                api.get('/playground/sessions'),
            ]);
            setAgents(agentsRes.data);
            setLimits(limitsRes.data);

            // Load existing sessions
            const existingSessions: Record<string, string> = {};
            sessionsRes.data.forEach((session: any) => {
                if (session.status === 'CONNECTED' || session.status === 'QR_READY') {
                    existingSessions[session.agentId] = session.id;
                    // Auto-expand connected sessions
                    if (session.status === 'CONNECTED') {
                        setExpandedAgentId(session.agentId);
                    }
                }
            });
            setSessions(existingSessions);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir este agente de teste?')) return;

        try {
            await api.delete(`/playground/agents/${id}`);
            toast.success('Agente excluído com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error deleting agent:', error);
            toast.error('Erro ao excluir agente');
        }
    }

    async function toggleWhatsAppConnection(agentId: string) {
        if (expandedAgentId === agentId) {
            setExpandedAgentId(null);
            return;
        }

        setExpandedAgentId(agentId);

        // Create session if not exists
        if (!sessions[agentId]) {
            try {
                const response = await api.post('/playground/sessions', { agentId });
                setSessions(prev => ({ ...prev, [agentId]: response.data.id }));
            } catch (error) {
                console.error('Error creating session:', error);
                toast.error('Erro ao criar sessão do WhatsApp');
                setExpandedAgentId(null);
            }
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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <FlaskConical className="h-8 w-8 text-primary" />
                        Playground - Teste Grátis
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Crie e teste agentes gratuitamente via WhatsApp antes de assinar
                    </p>
                </div>
                <Button
                    onClick={() => router.push('/company/playground/agents/new')}
                    disabled={limits && !limits.agents.canCreate}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Agente de Teste
                </Button>
            </div>

            {limits && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-purple-100">
                                Conexões de Teste
                            </CardTitle>
                            <FlaskConical className="h-4 w-4 text-purple-100" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{limits.agents.used}/{limits.agents.limit}</div>
                            <p className="text-xs text-purple-100 mt-1">
                                {!limits.agents.canCreate ? (
                                    <span className="font-medium">Limite atingido</span>
                                ) : (
                                    "Disponíveis para criação"
                                )}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-blue-100">
                                Mensagens Hoje
                            </CardTitle>
                            <MessageCircle className="h-4 w-4 text-blue-100" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{limits.messages.used}/{limits.messages.limit}</div>
                            <p className="text-xs text-blue-100 mt-1">
                                {limits.messages.remaining} mensagens restantes
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <MessageCircle className="h-5 w-5 text-yellow-700 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-yellow-900 mb-2">Como funciona o teste grátis?</p>
                                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                                    <li>Crie um agente de teste com seu prompt personalizado</li>
                                    <li>Clique em "Conectar WhatsApp" e escaneie o QR code</li>
                                    <li>Envie mensagens reais e veja como o agente responde</li>
                                    <li>Quando estiver satisfeito, assine um plano para uso em produção</li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-l-2 border-yellow-300 pl-6">
                            <p className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                                <svg className="h-5 w-5 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Como conectar o WhatsApp
                            </p>
                            <ol className="space-y-2 text-sm text-yellow-800">
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                    <span>Abra o WhatsApp no seu telefone</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                    <span>Toque em <strong>Menu</strong> ou <strong>Configurações</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                    <span>Toque em <strong>Aparelhos conectados</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                                    <span>Toque em <strong>Conectar um aparelho</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                                    <span>Aponte seu telefone para o QR code na tela</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {agents.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center py-12">
                            <FlaskConical className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                Nenhum agente de teste criado ainda
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Crie seu primeiro agente e teste gratuitamente via WhatsApp
                            </p>
                            <Button
                                onClick={() => router.push('/company/playground/agents/new')}
                                disabled={limits && !limits.agents.canCreate}
                                size="lg"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Criar Primeiro Agente de Teste
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    agents.map((agent) => (
                        <div key={agent.id} className="space-y-4">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card className="hover:shadow-lg transition-all duration-300 h-full border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50/30">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                                                        <FlaskConical className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl font-bold text-gray-900">
                                                            {agent.name}
                                                        </CardTitle>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 mt-1">
                                                            <FlaskConical className="h-3 w-3" /> Modo de Teste
                                                        </span>
                                                    </div>
                                                </div>
                                                {agent.description && (
                                                    <CardDescription className="text-sm text-gray-600 ml-14">
                                                        {agent.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {limits && limits.agents.canCreate && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(agent.id)}
                                                        title="Excluir agente"
                                                        className="hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200/50">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                                                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Prompt do Sistema</p>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                                                {agent.prompt}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                            <div className="text-xs text-gray-500">
                                                <span className="font-medium">Criado:</span> {new Date(agent.createdAt).toLocaleDateString('pt-PT')}
                                            </div>

                                            <Button
                                                onClick={() => toggleWhatsAppConnection(agent.id)}
                                                className={expandedAgentId === agent.id
                                                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all"}
                                                variant={expandedAgentId === agent.id ? "outline" : "default"}
                                                size="sm"
                                            >
                                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                                {expandedAgentId === agent.id ? 'Ocultar Conexão' : 'Conectar WhatsApp'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {expandedAgentId === agent.id && sessions[agent.id] ? (
                                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                        <PlaygroundQRDisplay
                                            sessionId={sessions[agent.id]}
                                            onConnected={() => {
                                                toast.success('WhatsApp conectado com sucesso!');
                                                loadData();
                                            }}
                                            onDisconnected={() => {
                                                toast.info('WhatsApp desconectado');
                                                setSessions(prev => {
                                                    const newSessions = { ...prev };
                                                    delete newSessions[agent.id];
                                                    return newSessions;
                                                });
                                                setExpandedAgentId(null);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <Card className="hover:shadow-md transition-shadow h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                        <CardContent className="pt-6 text-center flex flex-col items-center gap-4">
                                            <svg className="h-24 w-24 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                            <p className="text-sm text-green-700 font-medium mb-2">Clique em "Conectar WhatsApp" para começar</p>
                                            <Button
                                                onClick={() => toggleWhatsAppConnection(agent.id)}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                                Conectar WhatsApp
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {agents.length > 0 && (
                <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20" />
                    <CardContent className="relative py-12 px-6 text-center">
                        <div className="max-w-3xl mx-auto space-y-8">
                            <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/20 mb-4">
                                <Crown className="h-8 w-8 text-white" />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-3xl font-bold text-white">
                                    Pronto para escalar sua operação?
                                </h3>
                                <p className="text-lg text-white/90 max-w-2xl mx-auto">
                                    Desbloqueie todo o potencial da plataforma com nossos planos premium.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto py-6">
                                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Zap className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="font-semibold text-white">Múltiplos Agentes</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <MessageCircle className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="font-semibold text-white">Múltiplas Conexões</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Crown className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="font-semibold text-white">Suporte Prioritário</span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={() => router.push('/company/billing/upgrade')}
                                    size="lg"
                                    className="bg-white text-blue-600 hover:bg-white/90 shadow-lg px-8 h-12 text-lg rounded-full transition-all hover:scale-105 font-semibold"
                                >
                                    Ver Planos e Preços
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

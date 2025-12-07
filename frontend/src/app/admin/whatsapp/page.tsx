'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, QrCode, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Agent {
    id: string;
    name: string;
    prompt: string;
}

interface Session {
    id: string;
    agentId: string;
    status: string;
    qrCode: string | null;
    agent: {
        id: string;
        name: string;
    };
}

export default function WhatsAppConnectionPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectingAgentId, setConnectingAgentId] = useState<string | null>(null);
    const [qrCodes, setQrCodes] = useState<Map<string, string>>(new Map());
    const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());

    const fetchAgents = async () => {
        try {
            const res = await api.get('/agents');
            setAgents(res.data);
        } catch (error) {
            toast.error('Falha ao carregar agentes');
            console.error(error);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get('/whatsapp/sessions');
            setSessions(res.data);

            // Check if any session has a QR code and populate the map
            const newQrCodes = new Map<string, string>();
            res.data.forEach((session: Session) => {
                if (session.qrCode && session.status === 'QR_READY') {
                    newQrCodes.set(session.agentId, session.qrCode);
                }
            });

            if (newQrCodes.size > 0) {
                setQrCodes(prev => new Map([...prev, ...newQrCodes]));
            }
        } catch (error) {
            console.error('Failed to fetch sessions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
        fetchSessions();
    }, []);

    const getSessionForAgent = (agentId: string): Session | undefined => {
        return sessions.find(s => s.agentId === agentId);
    };

    const handleConnect = async (agentId: string) => {
        try {
            setConnectingAgentId(agentId);
            const res = await api.post('/whatsapp/session/create', { agentId });
            const sessionId = res.data.sessionId;

            toast.success('Conexão iniciada! Aguardando QR Code...');

            // Fetch sessions again to get the new session
            await fetchSessions();

            // Start polling for QR code
            startPolling(sessionId, agentId);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Falha ao iniciar conexão');
            setConnectingAgentId(null);
        }
    };

    const startPolling = (sessionId: string, agentId: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/whatsapp/session/${sessionId}/status`);

                if (res.data.qrCode) {
                    setQrCodes(prev => new Map(prev).set(agentId, res.data.qrCode));
                }

                if (res.data.status === 'CONNECTED') {
                    setQrCodes(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(agentId);
                        return newMap;
                    });
                    setConnectingAgentId(null);
                    stopPolling(agentId);
                    toast.success('WhatsApp conectado com sucesso!');
                    fetchSessions();
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000);

        setPollingIntervals(prev => new Map(prev).set(agentId, interval));

        // Stop polling after 2 minutes
        setTimeout(() => {
            stopPolling(agentId);
            setConnectingAgentId(null);
        }, 120000);
    };

    const stopPolling = (agentId: string) => {
        const interval = pollingIntervals.get(agentId);
        if (interval) {
            clearInterval(interval);
            setPollingIntervals(prev => {
                const newMap = new Map(prev);
                newMap.delete(agentId);
                return newMap;
            });
        }
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            pollingIntervals.forEach(interval => clearInterval(interval));
        };
    }, [pollingIntervals]);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Conexões WhatsApp
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Conecte seus agentes ao WhatsApp Business
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : agents.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-gray-500">
                                Nenhum agente encontrado. Crie um agente primeiro para conectar ao WhatsApp.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {agents.map((agent) => {
                            const session = getSessionForAgent(agent.id);
                            const qrCode = qrCodes.get(agent.id);
                            const isConnecting = connectingAgentId === agent.id;

                            return (
                                <Card key={agent.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Smartphone className="w-6 h-6" />
                                                <div>
                                                    <CardTitle>{agent.name}</CardTitle>
                                                    <CardDescription>
                                                        {session ? `Sessão: ${session.id.substring(0, 8)}...` : 'Sem sessão ativa'}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            {session && (
                                                <Badge variant={session.status === 'CONNECTED' ? 'default' : 'secondary'}>
                                                    {session.status === 'CONNECTED' ? (
                                                        <><CheckCircle className="w-3 h-3 mr-1" /> Conectado</>
                                                    ) : (
                                                        <><XCircle className="w-3 h-3 mr-1" /> {session.status}</>
                                                    )}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {qrCode && (
                                            <div className="border-2 border-green-500 rounded-lg p-6">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                                                        <QrCode className="w-5 h-5" />
                                                        Escaneie o QR Code
                                                    </div>
                                                    <p className="text-sm text-gray-600 text-center">
                                                        Abra o WhatsApp no seu celular → Configurações → Aparelhos conectados → Conectar aparelho
                                                    </p>
                                                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                                                </div>
                                            </div>
                                        )}

                                        {!session && !isConnecting && (
                                            <Button onClick={() => handleConnect(agent.id)} className="w-full">
                                                <Smartphone className="w-4 h-4 mr-2" />
                                                Conectar WhatsApp
                                            </Button>
                                        )}

                                        {isConnecting && !qrCode && (
                                            <Button disabled className="w-full">
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Gerando QR Code...
                                            </Button>
                                        )}

                                        {session && session.status === 'DISCONNECTED' && !isConnecting && (
                                            <Button onClick={() => handleConnect(agent.id)} variant="outline" className="w-full">
                                                <Smartphone className="w-4 h-4 mr-2" />
                                                Reconectar
                                            </Button>
                                        )}

                                        {session && session.status === 'CONNECTED' && (
                                            <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="font-semibold">WhatsApp Ativo</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

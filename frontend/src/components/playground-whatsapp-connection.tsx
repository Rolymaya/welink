'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, XCircle, CheckCircle2, QrCode as QrCodeIcon, Smartphone } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface PlaygroundWhatsAppProps {
    agentId: string;
    agentName: string;
}

interface Session {
    id: string;
    status: 'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATED' | 'CONNECTED';
    qrCode?: string;
}

const STATUS_CONFIG = {
    DISCONNECTED: { label: 'Desconectado', color: 'bg-gray-500', icon: XCircle },
    QR_READY: { label: 'Aguardando QR', color: 'bg-yellow-500', icon: QrCodeIcon },
    AUTHENTICATED: { label: 'Autenticando...', color: 'bg-blue-500', icon: RefreshCw },
    CONNECTED: { label: 'Conectado', color: 'bg-green-500', icon: CheckCircle2 },
};

export default function PlaygroundWhatsAppConnection({ agentId, agentName }: PlaygroundWhatsAppProps) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        loadSession();
    }, [agentId]);

    // Auto-refresh when QR_READY
    useEffect(() => {
        if (session?.status === 'QR_READY' || session?.status === 'AUTHENTICATED') {
            const interval = setInterval(loadSession, 3000);
            return () => clearInterval(interval);
        }
    }, [session?.status]);

    async function loadSession() {
        try {
            const response = await api.get(`/playground/sessions?agentId=${agentId}`);
            if (response.data && response.data.length > 0) {
                setSession(response.data[0]);
            } else {
                setSession(null);
            }
        } catch (error) {
            console.error('Error loading session:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleConnect() {
        setConnecting(true);
        try {
            const response = await api.post('/playground/sessions', { agentId });
            setSession(response.data);
            toast.success('Conexão iniciada! Aguarde o QR Code...');
            setTimeout(loadSession, 2000);
        } catch (error: any) {
            console.error('Error connecting:', error);
            toast.error(error.response?.data?.message || 'Erro ao conectar');
        } finally {
            setConnecting(false);
        }
    }

    async function handleReconnect() {
        if (!session) return;
        setConnecting(true);
        try {
            await api.post(`/playground/sessions/${session.id}/reconnect`);
            toast.success('Reconectando... Aguarde o QR Code');
            setTimeout(loadSession, 2000);
        } catch (error) {
            console.error('Error reconnecting:', error);
            toast.error('Erro ao reconectar');
        } finally {
            setConnecting(false);
        }
    }

    async function handleDisconnect() {
        if (!session) return;
        try {
            await api.delete(`/playground/sessions/${session.id}`);
            toast.success('Desconectado com sucesso');
            setSession(null);
        } catch (error) {
            console.error('Error disconnecting:', error);
            toast.error('Erro ao desconectar');
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <p className="text-gray-500">A carregar conexão...</p>
                </CardContent>
            </Card>
        );
    }

    if (!session) {
        return (
            <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="pt-6 text-center py-8">
                    <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-700 mb-2">WhatsApp não conectado</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Conecte seu WhatsApp para testar este agente
                    </p>
                    <Button onClick={handleConnect} disabled={connecting} className="bg-green-600 hover:bg-green-700">
                        <Smartphone className="mr-2 h-4 w-4" />
                        {connecting ? 'Conectando...' : 'Conectar WhatsApp'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const statusConfig = STATUS_CONFIG[session.status];
    const StatusIcon = statusConfig.icon;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        Conexão WhatsApp de Teste
                    </CardTitle>
                    <Badge className={`${statusConfig.color} text-white`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {session.status === 'QR_READY' && session.qrCode && (
                    <div className="flex flex-col items-center space-y-3 p-6 bg-white rounded-lg border-2 border-dashed border-green-300">
                        <p className="text-sm font-medium text-center text-gray-700">
                            📱 Escaneie este QR Code com o WhatsApp
                        </p>
                        {session.qrCode.startsWith('data:image') ? (
                            <img src={session.qrCode} alt="QR Code" className="w-[220px] h-[220px]" />
                        ) : (
                            <QRCodeSVG value={session.qrCode} size={220} />
                        )}
                        <div className="text-xs text-gray-600 text-center space-y-1">
                            <p>1. Abra o WhatsApp no seu celular</p>
                            <p>2. Toque em <strong>Dispositivos conectados</strong></p>
                            <p>3. Toque em <strong>Conectar dispositivo</strong></p>
                            <p>4. Aponte a câmera para este QR code</p>
                        </div>
                    </div>
                )}

                {session.status === 'AUTHENTICATED' && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Autenticando... Aguarde
                        </p>
                    </div>
                )}

                {session.status === 'CONNECTED' && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            ✓ WhatsApp conectado! Envie mensagens para testar o agente
                        </p>
                        <p className="text-xs text-green-700 mt-2">
                            Envie uma mensagem para o número conectado e veja o agente responder em tempo real.
                        </p>
                    </div>
                )}

                {session.status === 'DISCONNECTED' && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                            Conexão desconectada. Clique em reconectar para gerar um novo QR Code.
                        </p>
                    </div>
                )}

                <div className="flex gap-2">
                    {(session.status === 'DISCONNECTED' || session.status === 'QR_READY') && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={handleReconnect}
                            disabled={connecting}
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
                            onClick={handleDisconnect}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Desconectar
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

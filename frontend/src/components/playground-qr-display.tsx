'use client';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';

interface PlaygroundQRDisplayProps {
    sessionId: string;
    onConnected?: () => void;
    onDisconnected?: () => void;
}

export default function PlaygroundQRDisplay({ sessionId, onConnected, onDisconnected }: PlaygroundQRDisplayProps) {
    const [status, setStatus] = useState<'loading' | 'qr_ready' | 'connected' | 'disconnected' | 'error'>('loading');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasNotifiedConnection, setHasNotifiedConnection] = useState(false);

    useEffect(() => {
        let mounted = true;

        const checkStatus = async () => {
            try {
                const response = await api.get(`/playground/sessions/${sessionId}/status`);

                if (!mounted) return;

                const sessionStatus = response.data.status;
                const sessionQR = response.data.qrCode;

                if (sessionStatus === 'CONNECTED') {
                    setStatus('connected');
                    setQrCode(null);
                    if (!hasNotifiedConnection) {
                        onConnected?.();
                        setHasNotifiedConnection(true);
                    }
                } else if (sessionStatus === 'QR_READY' && sessionQR) {
                    setStatus('qr_ready');
                    setQrCode(sessionQR);
                } else if (sessionStatus === 'DISCONNECTED') {
                    setStatus('disconnected');
                    setQrCode(null);
                    onDisconnected?.();
                } else if (sessionStatus === 'CONNECTING') {
                    setStatus('loading');
                }
            } catch (err) {
                console.error('Error fetching session status:', err);
                if (mounted) {
                    setStatus('error');
                    setError('Erro ao verificar status');
                }
            }
        };

        // Check immediately
        checkStatus();

        // Then poll
        const interval = setInterval(checkStatus, 3000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [sessionId, onConnected, onDisconnected, hasNotifiedConnection]);

    const handleDisconnect = async () => {
        try {
            await api.post(`/playground/sessions/${sessionId}/disconnect`);
            setStatus('disconnected');
            onDisconnected?.();
        } catch (err) {
            console.error('Error disconnecting session:', err);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                <p className="text-gray-600 font-medium">Iniciando conexão...</p>
            </div>
        );
    }

    if (status === 'qr_ready' && qrCode) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Escaneie o QR Code</h3>
                <p className="text-sm text-gray-500 mb-6 text-center">
                    Abra o WhatsApp no seu telemóvel e escaneie o código abaixo
                </p>

                <div className="p-4 bg-white rounded-lg border-2 border-gray-100 shadow-sm mb-4">
                    <QRCodeSVG value={qrCode} size={260} />
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>A aguardar leitura...</span>
                </div>
            </div>
        );
    }

    if (status === 'connected') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-xl border border-green-100">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">WhatsApp Conectado!</h3>
                <p className="text-sm text-green-700 mb-6 text-center">
                    O seu agente está pronto para responder mensagens.
                </p>
                <Button variant="outline" onClick={handleDisconnect} className="border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800">
                    Desconectar
                </Button>
            </div>
        );
    }

    if (status === 'error' || status === 'disconnected') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl border border-red-100">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Desconectado</h3>
                <p className="text-sm text-red-700 mb-6 text-center">
                    {error || 'A sessão foi desconectada.'}
                </p>
                <Button variant="outline" onClick={() => window.location.reload()} className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800">
                    Tentar Novamente
                </Button>
            </div>
        );
    }

    return null;
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Globe, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KnowledgeBase {
    id: string;
    name: string;
    type: 'FILE' | 'URL' | 'TEXT';
    status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
    sourceUrl?: string;
    errorMessage?: string;
    createdAt: string;
    _count: {
        vectors: number;
    };
}

export default function KnowledgeBasePage() {
    const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchKbs = async () => {
        try {
            const res = await api.get('/knowledge');
            setKbs(res.data);
        } catch (error) {
            console.error('Error fetching KBs:', error);
            toast.error('Erro ao carregar base de conhecimento');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKbs();
        // Poll for updates if any KB is processing
        const interval = setInterval(() => {
            setKbs(current => {
                if (current.some(kb => kb.status === 'PROCESSING' || kb.status === 'PENDING')) {
                    fetchKbs();
                }
                return current;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta base de conhecimento?')) return;

        try {
            await api.delete(`/knowledge/${id}`);
            toast.success('Base de conhecimento excluída');
            fetchKbs();
        } catch (error) {
            console.error('Error deleting KB:', error);
            toast.error('Erro ao excluir');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'READY':
                return <Badge className="bg-green-500">Pronto</Badge>;
            case 'PROCESSING':
                return <Badge className="bg-blue-500 animate-pulse">Processando</Badge>;
            case 'PENDING':
                return <Badge variant="secondary">Aguardando</Badge>;
            case 'ERROR':
                return <Badge variant="destructive">Erro</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'URL':
                return <Globe className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
                    <p className="text-gray-500 mt-2">Gerencie os documentos e links que seus agentes usarão.</p>
                </div>
                <Link href="/company/knowledge/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Novo
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : kbs.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">Nenhum documento encontrado</h3>
                        <p className="text-gray-500 mt-2 mb-6 max-w-sm">
                            Comece adicionando documentos PDF, Word ou links de sites para treinar seus agentes.
                        </p>
                        <Link href="/company/knowledge/new">
                            <Button variant="outline">Adicionar Documento</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {kbs.map((kb) => (
                        <Card key={kb.id}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                        {getTypeIcon(kb.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{kb.name}</h3>
                                        <div className="flex items-center text-sm text-gray-500 space-x-2 mt-1">
                                            <span>{kb._count.vectors} vetores</span>
                                            <span>•</span>
                                            <span>
                                                {formatDistanceToNow(new Date(kb.createdAt), {
                                                    addSuffix: true,
                                                    locale: ptBR,
                                                })}
                                            </span>
                                            {kb.errorMessage && (
                                                <span className="text-red-500 text-xs ml-2">
                                                    Error: {kb.errorMessage}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    {getStatusBadge(kb.status)}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-red-500"
                                        onClick={() => handleDelete(kb.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

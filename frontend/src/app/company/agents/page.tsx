'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Bot, Play, Pause } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PageHeader, PAGE_ANIMATION } from '@/components/page-header';
import { cn } from '@/lib/utils';

interface Agent {
    id: string;
    name: string;
    prompt: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function AgentsPage() {
    const router = useRouter();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAgents();
    }, []);

    async function loadAgents() {
        try {
            const response = await api.get('/agents');
            setAgents(response.data);
        } catch (error) {
            console.error('Error loading agents:', error);
            toast.error(`Erro ao carregar agentes: ${(error as any).message}`);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleStatus(agent: Agent) {
        try {
            const newStatus = !agent.isActive;
            await api.patch(`/agents/${agent.id}`, { isActive: newStatus });

            setAgents(agents.map(a =>
                a.id === agent.id ? { ...a, isActive: newStatus } : a
            ));

            toast.success(`Agente ${newStatus ? 'ativado' : 'pausado'} com sucesso!`);
        } catch (error) {
            console.error('Error updating agent status:', error);
            toast.error('Erro ao atualizar status do agente');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja eliminar este agente?')) return;

        try {
            await api.delete(`/agents/${id}`);
            toast.success('Agente eliminado com sucesso!');
            loadAgents();
        } catch (error) {
            console.error('Error deleting agent:', error);
            toast.error('Erro ao eliminar agente');
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
                title="Agentes de IA"
                description="Gerencie os assistentes virtuais da sua empresa e automatize o atendimento"
            >
                <Button onClick={() => router.push('/company/agents/create')} size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                    <Plus className="mr-2 h-5 w-5" />
                    Criar Agente
                </Button>
            </PageHeader>

            {agents.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Bot className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum agente criado</h3>
                        <p className="text-gray-500 text-center mb-4">
                            Comece criando o seu primeiro agente de IA para automatizar o atendimento
                        </p>
                        <Button onClick={() => router.push('/company/agents/create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Primeiro Agente
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent) => (
                        <Card key={agent.id} className="hover:shadow-lg transition-shadow relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Bot className={`h-5 w-5 ${agent.isActive ? 'text-primary' : 'text-gray-400'}`} />
                                        <div>
                                            <CardTitle className="text-lg">{agent.name}</CardTitle>
                                            <Badge variant={agent.isActive ? 'default' : 'secondary'} className="mt-1 text-xs">
                                                {agent.isActive ? 'Ativo' : 'Pausado'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleStatus(agent)}
                                            title={agent.isActive ? "Pausar Agente" : "Ativar Agente"}
                                        >
                                            {agent.isActive ? (
                                                <Pause className="h-4 w-4 text-orange-500" />
                                            ) : (
                                                <Play className="h-4 w-4 text-green-500" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/company/agents/${agent.id}/edit`)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(agent.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription className="line-clamp-3 mt-2">
                                    {agent.prompt}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-gray-500">
                                    Criado em {new Date(agent.createdAt).toLocaleDateString('pt-PT')}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

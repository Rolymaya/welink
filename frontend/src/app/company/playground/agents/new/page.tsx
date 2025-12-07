'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function NewPlaygroundAgentPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        prompt: '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            await api.post('/playground/agents', formData);
            toast.success('Agente de teste criado com sucesso!');
            router.push('/company/playground/agents');
        } catch (error: any) {
            console.error('Error creating agent:', error);
            toast.error(error.response?.data?.message || 'Erro ao criar agente');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <h1 className="text-3xl font-bold">Novo Agente de Teste</h1>
                <p className="text-gray-500 mt-1">
                    Crie um agente para testar conversas sem afetar dados reais
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informações do Agente</CardTitle>
                    <CardDescription>
                        Defina o nome, descrição e comportamento do agente
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Agente *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Assistente de Vendas"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição (Opcional)</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ex: Agente para testar vendas de produtos"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="prompt">Prompt do Sistema *</Label>
                            <Textarea
                                id="prompt"
                                value={formData.prompt}
                                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                placeholder="Ex: Você é um assistente de vendas amigável. Ajude os clientes a encontrar produtos e responda suas dúvidas."
                                rows={8}
                                required
                            />
                            <p className="text-xs text-gray-500">
                                Este prompt define como o agente vai se comportar nas conversas
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'A criar...' : 'Criar Agente'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

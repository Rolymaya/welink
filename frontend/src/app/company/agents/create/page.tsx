'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionRequiredOverlay from '@/components/subscription-required-overlay';
import LimitReachedOverlay from '@/components/limit-reached-overlay';

const formSchema = z.object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    prompt: z.string().min(10, 'O prompt deve ter pelo menos 10 caracteres'),
});

export default function CreateAgentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { hasActiveSubscription, subscription, loading: subscriptionLoading } = useSubscription();
    const [showNoSubscriptionModal, setShowNoSubscriptionModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [usage, setUsage] = useState<any>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            prompt: '',
        },
    });

    useEffect(() => {
        checkAccess();
    }, [hasActiveSubscription, subscription, subscriptionLoading]);

    async function checkAccess() {
        if (subscriptionLoading) return;

        // Check if has subscription
        if (!hasActiveSubscription) {
            setShowNoSubscriptionModal(true);
            return;
        }

        // Load usage and check limit
        try {
            const response = await api.get('/subscriptions/usage');
            setUsage(response.data);

            if (subscription) {
                console.log('DEBUG AGENTS:', {
                    subscription,
                    package: subscription.package,
                    maxAgents: subscription.package?.maxAgents,
                    usage: response.data.agents
                });

                const limit = subscription.package?.maxAgents || 0;
                if (response.data.agents >= limit) {
                    setShowLimitModal(true);
                }
            }
        } catch (error) {
            console.error('Error loading usage:', error);
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            await api.post('/agents', values);
            toast.success('Agente criado com sucesso!');
            router.push('/company/agents');
        } catch (error) {
            console.error('Error creating agent:', error);
            toast.error('Erro ao criar agente. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    if (subscriptionLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">A carregar...</div>
            </div>
        );
    }

    return (
        <>
            <SubscriptionRequiredOverlay show={showNoSubscriptionModal} />
            <LimitReachedOverlay
                show={showLimitModal}
                resourceType="agentes"
                currentLimit={subscription?.package?.maxAgents || 0}
                onClose={() => router.push('/company/agents')}
            />
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </div>

                <div>
                    <h1 className="text-3xl font-bold">Criar Novo Agente</h1>
                    <p className="text-gray-500 mt-1">
                        Configure um assistente virtual para automatizar o atendimento
                    </p>
                </div>

                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Lightbulb className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-blue-900">Dicas para um bom prompt</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-800 space-y-2">
                        <p>• Defina claramente a personalidade e tom do agente (formal, amigável, técnico)</p>
                        <p>• Especifique o que o agente pode e não pode fazer</p>
                        <p>• Inclua exemplos de como responder a perguntas comuns</p>
                        <p>• Mencione informações importantes sobre a empresa</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Agente</CardTitle>
                        <CardDescription>
                            Preencha os dados básicos do seu assistente virtual
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do Agente</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ex: Assistente de Vendas"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Um nome descritivo para identificar o agente
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="prompt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prompt do Sistema</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Você é um assistente de vendas amigável e profissional. Ajude os clientes a encontrar produtos, responda suas dúvidas sobre preços e disponibilidade, e forneça informações sobre nossa política de devolução..."
                                                    className="min-h-[200px] resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Instruções que definem o comportamento e personalidade do agente ({field.value.length} caracteres)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'A criar...' : 'Criar Agente'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

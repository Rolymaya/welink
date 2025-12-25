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
import { Lightbulb } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionRequiredOverlay from '@/components/subscription-required-overlay';
import LimitReachedOverlay from '@/components/limit-reached-overlay';
import { PageHeader, PAGE_ANIMATION } from '@/components/page-header';
import { cn } from '@/lib/utils';

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
            <div className={cn("max-w-3xl mx-auto space-y-8", PAGE_ANIMATION)}>
                <PageHeader
                    title="Criar Novo Agente"
                    description="Configure um assistente virtual para automatizar o atendimento"
                    showBackButton
                />

                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 transition-all duration-300">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <CardTitle className="text-blue-900 dark:text-blue-100">Dicas para um bom prompt</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                        <p>• Defina claramente a personalidade e tom do agente (formal, amigável, técnico)</p>
                        <p>• Especifique o que o agente pode e não pode fazer</p>
                        <p>• Inclua exemplos de como responder a perguntas comuns</p>
                        <p>• Mencione informações importantes sobre a empresa</p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-t-4 border-t-primary transition-all duration-300">
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
                                                    className="transition-all focus:ring-2 focus:ring-primary/20"
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
                                                    placeholder="Você é um assistente de vendas amigável e profissional..."
                                                    className="min-h-[200px] resize-none transition-all focus:ring-2 focus:ring-primary/20"
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

                                <div className="flex justify-end space-x-4 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={loading} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-lg shadow-primary/20 transition-all duration-300">
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

const formSchema = z.object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    prompt: z.string().min(10, 'O prompt deve ter pelo menos 10 caracteres'),
});

export default function EditAgentPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            prompt: '',
        },
    });

    useEffect(() => {
        loadAgent();
    }, []);

    async function loadAgent() {
        try {
            const response = await api.get(`/agents/${params.id}`);
            form.reset({
                name: response.data.name,
                prompt: response.data.prompt,
            });
        } catch (error) {
            console.error('Error loading agent:', error);
            toast.error('Erro ao carregar agente');
            router.push('/company/agents');
        } finally {
            setLoadingData(false);
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            await api.patch(`/agents/${params.id}`, values);
            toast.success('Agente atualizado com sucesso!');
            router.push('/company/agents');
        } catch (error) {
            console.error('Error updating agent:', error);
            toast.error('Erro ao atualizar agente. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    if (loadingData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">A carregar...</div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
            </div>

            <div>
                <h1 className="text-3xl font-bold">Editar Agente</h1>
                <p className="text-gray-500 mt-1">
                    Atualize as configurações do seu assistente virtual
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
                        Atualize os dados do seu assistente virtual
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
                                                placeholder="Você é um assistente de vendas amigável e profissional..."
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
                                    {loading ? 'A guardar...' : 'Guardar Alterações'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

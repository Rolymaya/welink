'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogoUpload } from '@/components/logo-upload';
import api from '@/lib/api';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    sector: z.string().min(1, 'Selecione um setor'),
    description: z.string().optional(),
    logo: z.string().optional(),
});

const SECTORS = [
    'E-commerce',
    'Saúde',
    'Educação',
    'Tecnologia',
    'Varejo',
    'Serviços',
    'Imobiliária',
    'Automotivo',
    'Outro',
];

export default function CompanyOnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            sector: '',
            description: '',
            logo: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('sector', values.sector);
            if (values.description) formData.append('description', values.description);
            if (logoFile) formData.append('logo', logoFile);

            const response = await api.post('/organization/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Update token with new role and orgId
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
            }

            toast.success('Empresa registrada com sucesso!');
            router.push('/onboarding/profile');
        } catch (error) {
            console.error('Error registering company:', error);
            toast.error('Erro ao registrar empresa. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Dados da Empresa</h2>
                <p className="text-sm text-gray-500">Comece informando os dados básicos do seu negócio.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Logotipo</FormLabel>
                                <FormControl>
                                    <LogoUpload
                                        value={field.value}
                                        onChange={field.onChange}
                                        onFileSelect={(file) => setLogoFile(file)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Empresa</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Minha Loja Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="sector"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Setor de Atuação</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um setor" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {SECTORS.map((sector) => (
                                            <SelectItem key={sector} value={sector}>
                                                {sector}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Descreva brevemente o que sua empresa faz..."
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Salvando...' : 'Continuar'}
                    </Button>
                </form>
            </Form>
        </div>
    );
}

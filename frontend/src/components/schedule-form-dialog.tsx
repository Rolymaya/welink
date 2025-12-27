'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Clock, User, FileText, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const scheduleSchema = z.object({
    subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
    contactId: z.string().optional(),
    client: z.string().optional(),
    date: z.string().min(1, 'Data é obrigatória'),
    time: z.string().min(1, 'Hora é obrigatória'),
    summary: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface Contact {
    id: string;
    name: string;
    phone: string;
}

interface ScheduleFormDialogProps {
    onSuccess?: () => void;
}

export function ScheduleFormDialog({ onSuccess }: ScheduleFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(true);

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema),
    });

    const selectedContactId = watch('contactId');

    useEffect(() => {
        if (open) {
            loadContacts();
        }
    }, [open]);

    useEffect(() => {
        if (selectedContactId) {
            const contact = contacts.find(c => c.id === selectedContactId);
            if (contact) {
                setValue('client', contact.name);
            }
        }
    }, [selectedContactId, contacts, setValue]);

    const loadContacts = async () => {
        try {
            const response = await api.get('/contacts');
            setContacts(response.data);
        } catch (error) {
            console.error('Error loading contacts:', error);
            toast.error('Erro ao carregar contactos');
        } finally {
            setLoadingContacts(false);
        }
    };

    const onSubmit = async (data: ScheduleFormData) => {
        setLoading(true);
        try {
            const dateTime = `${data.date}T${data.time}:00`;
            await api.post('/agenda', {
                subject: data.subject,
                client: data.client,
                date: dateTime,
                summary: data.summary,
                contactId: data.contactId || undefined,
            });

            toast.success('Agendamento criado com sucesso!');
            setOpen(false);
            reset();
            onSuccess?.();
        } catch (error: any) {
            console.error('Error creating schedule:', error);
            toast.error(error.response?.data?.message || 'Erro ao criar agendamento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Agendamento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Criar Agendamento
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Assunto *
                        </Label>
                        <Input
                            id="subject"
                            placeholder="Ex: Reunião de apresentação"
                            {...register('subject')}
                        />
                        {errors.subject && (
                            <p className="text-sm text-destructive">{errors.subject.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contactId" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Contacto
                        </Label>
                        <Select
                            onValueChange={(value) => setValue('contactId', value)}
                            disabled={loadingContacts}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loadingContacts ? "Carregando..." : "Selecione um contacto"} />
                            </SelectTrigger>
                            <SelectContent>
                                {contacts.map((contact) => (
                                    <SelectItem key={contact.id} value={contact.id}>
                                        {contact.name} ({contact.phone})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="client">
                            Nome do Cliente (manual)
                        </Label>
                        <Input
                            id="client"
                            placeholder="Ou digite o nome manualmente"
                            {...register('client')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Data *
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                {...register('date')}
                            />
                            {errors.date && (
                                <p className="text-sm text-destructive">{errors.date.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Hora *
                            </Label>
                            <Input
                                id="time"
                                type="time"
                                {...register('time')}
                            />
                            {errors.time && (
                                <p className="text-sm text-destructive">{errors.time.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary">
                            Resumo / Notas
                        </Label>
                        <Textarea
                            id="summary"
                            placeholder="Detalhes adicionais sobre o agendamento..."
                            rows={3}
                            {...register('summary')}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Criando...' : 'Criar Agendamento'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

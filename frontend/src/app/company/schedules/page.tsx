'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader, PAGE_ANIMATION } from '@/components/page-header';
import { ScheduleFormDialog } from '@/components/schedule-form-dialog';
import { cn } from '@/lib/utils';

interface Agenda {
    id: string;
    subject: string;
    client: string;
    date: string;
    summary: string;
    contact?: {
        phone: string;
    };
}

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<Agenda[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            const response = await api.get('/agenda');
            setSchedules(response.data);
        } catch (error) {
            console.error('Error loading schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-8", PAGE_ANIMATION)}>
            <PageHeader
                title="Agendamentos"
                description="Gerencie suas reuniões e compromissos agendados pela IA"
                action={<ScheduleFormDialog onSuccess={loadSchedules} />}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {schedules.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-border/50">
                        <Calendar className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-xl font-semibold text-foreground">Nenhum agendamento</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                            Os agendamentos feitos pelos agentes aparecerão aqui automaticamente.
                        </p>
                    </div>
                ) : (
                    schedules.map((agenda) => (
                        <Card key={agenda.id} className="group hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30 overflow-hidden">
                            <CardHeader className="pb-3 bg-muted/30 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none font-semibold">
                                        {format(new Date(agenda.date), "dd 'de' MMMM", { locale: ptBR })}
                                    </Badge>
                                    <div className="p-2 rounded-full bg-background/80 shadow-sm">
                                        <Clock className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{agenda.subject}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    <Clock className="h-4 w-4 mr-3 text-primary" />
                                    {format(new Date(agenda.date), "HH:mm", { locale: ptBR })}
                                </div>
                                <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    <User className="h-4 w-4 mr-3 text-blue-500" />
                                    <div className="flex flex-col">
                                        <span>{agenda.client}</span>
                                        {agenda.contact?.phone && <span className="text-xs text-muted-foreground font-normal">{agenda.contact.phone}</span>}
                                    </div>
                                </div>
                                {agenda.summary && (
                                    <div className="pt-3 border-t border-border/50">
                                        <div className="flex items-start text-sm text-muted-foreground italic leading-relaxed">
                                            <FileText className="h-4 w-4 mr-3 text-amber-500 mt-1 flex-shrink-0" />
                                            <p className="line-clamp-3">{agenda.summary}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

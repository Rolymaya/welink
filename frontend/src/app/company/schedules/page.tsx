'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
        return <div className="p-8 text-center text-gray-500">Carregando agendamentos...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
                    <p className="text-gray-500 mt-2">Gerencie suas reuniões e compromissos agendados pela IA.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {schedules.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum agendamento</h3>
                        <p className="mt-1 text-sm text-gray-500">Os agendamentos feitos pelos agentes aparecerão aqui.</p>
                    </div>
                ) : (
                    schedules.map((agenda) => (
                        <Card key={agenda.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                        {format(new Date(agenda.date), "dd 'de' MMMM", { locale: ptBR })}
                                    </Badge>
                                    <Clock className="h-4 w-4 text-gray-400" />
                                </div>
                                <CardTitle className="text-lg font-semibold mt-2">{agenda.subject}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="h-4 w-4 mr-2 text-purple-500" />
                                    {format(new Date(agenda.date), "HH:mm", { locale: ptBR })}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <User className="h-4 w-4 mr-2 text-purple-500" />
                                    {agenda.client}
                                    {agenda.contact?.phone && <span className="text-xs text-gray-400 ml-2">({agenda.contact.phone})</span>}
                                </div>
                                {agenda.summary && (
                                    <div className="pt-2 border-t border-gray-100 mt-2">
                                        <div className="flex items-start text-sm text-gray-600">
                                            <FileText className="h-4 w-4 mr-2 text-purple-500 mt-0.5" />
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

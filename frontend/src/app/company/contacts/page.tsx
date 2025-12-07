'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Phone } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Contact {
    id: string;
    phone: string;
    name: string | null;
    tags: string;
    createdAt: string;
    _count: {
        messages: number;
    };
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContacts();
    }, []);

    async function loadContacts() {
        try {
            const response = await api.get('/contacts');
            setContacts(response.data);
        } catch (error) {
            console.error('Error loading contacts:', error);
            toast.error(`Erro ao carregar contactos: ${(error as any).message}`);
        } finally {
            setLoading(false);
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Contactos</h1>
                    <p className="text-gray-500 mt-1">
                        Clientes que interagiram com os seus agentes
                    </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{contacts.length} contactos</span>
                </div>
            </div>

            {contacts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum contacto</h3>
                        <p className="text-gray-500 text-center mb-4">
                            Os contactos aparecerão aqui quando os clientes começarem a interagir com os seus agentes
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Contactos</CardTitle>
                        <CardDescription>
                            Todos os clientes que enviaram mensagens aos seus agentes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Mensagens</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Criado em</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map((contact) => (
                                    <TableRow key={contact.id}>
                                        <TableCell className="font-medium">
                                            {contact.name || 'Sem nome'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                <span>{contact.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {contact._count.messages}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {contact.tags ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {contact.tags.split(',').map((tag, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {tag.trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {new Date(contact.createdAt).toLocaleDateString('pt-PT', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

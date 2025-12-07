import { buildApiUrl } from '@/lib/apiUrl';
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Receipt, Calendar } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Transaction {
    id: string;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    type: 'NEW_SUBSCRIPTION' | 'RENEWAL';
    createdAt: string;
    subscription: {
        id: string;
        package: {
            name: string;
        };
        startDate: string;
        endDate: string;
        status: string;
    };
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED'>('ALL');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl(''), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const subscriptions = await response.json();
                // Extract transactions from subscriptions
                const allTransactions: Transaction[] = [];
                subscriptions.forEach((sub: any) => {
                    if (sub.transactions) {
                        sub.transactions.forEach((txn: any) => {
                            allTransactions.push({
                                ...txn,
                                subscription: {
                                    id: sub.id,
                                    package: sub.package,
                                    startDate: sub.startDate,
                                    endDate: sub.endDate,
                                    status: sub.status,
                                },
                            });
                        });
                    }
                });
                setTransactions(allTransactions.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ));
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(txn => {
        // Filter by status
        if (filter !== 'ALL' && txn.status !== filter) return false;

        // Filter by date range
        const txnDate = new Date(txn.createdAt);
        if (startDate && isBefore(txnDate, startOfDay(new Date(startDate)))) return false;
        if (endDate && isAfter(txnDate, endOfDay(new Date(endDate)))) return false;

        return true;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Histórico de Transações</h1>
                <p className="text-muted-foreground">Veja todas as suas transações e pagamentos de subscrições.</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                        {/* Date Filters */}
                        <div className="flex gap-4 items-end">
                            <div className="w-48">
                                <Label htmlFor="startDate" className="text-xs">Data Inicial</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div className="w-48">
                                <Label htmlFor="endDate" className="text-xs">Data Final</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setStartDate('');
                                        setEndDate('');
                                    }}
                                >
                                    Limpar Datas
                                </Button>
                            )}
                        </div>

                        {/* Status Filters */}
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'ALL' ? 'default' : 'outline'}
                                onClick={() => setFilter('ALL')}
                                size="sm"
                            >
                                Todas
                            </Button>
                            <Button
                                variant={filter === 'PENDING' ? 'default' : 'outline'}
                                onClick={() => setFilter('PENDING')}
                                size="sm"
                            >
                                Pendentes
                            </Button>
                            <Button
                                variant={filter === 'COMPLETED' ? 'default' : 'outline'}
                                onClick={() => setFilter('COMPLETED')}
                                size="sm"
                            >
                                Concluídas
                            </Button>
                            <Button
                                variant={filter === 'FAILED' ? 'default' : 'outline'}
                                onClick={() => setFilter('FAILED')}
                                size="sm"
                            >
                                Falhadas
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <p>Carregando transações...</p>
                </div>
            ) : filteredTransactions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma transação encontrada.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="rounded-md border shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Pacote</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Período de Subscrição</TableHead>
                                <TableHead>Status da Subscrição</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map((txn) => (
                                <TableRow key={txn.id}>
                                    <TableCell>
                                        {format(new Date(txn.createdAt), 'dd/MM/yyyy HH:mm')}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {txn.subscription.package.name}
                                    </TableCell>
                                    <TableCell className="font-semibold text-blue-600">
                                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(txn.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                                            {txn.type.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {txn.status === 'COMPLETED' ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                                                ✓ Completed
                                            </span>
                                        ) : txn.status === 'PENDING' ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm">
                                                ⏱ Pending
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
                                                ✕ Failed
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {format(new Date(txn.subscription.startDate), 'dd/MM/yyyy')} - {format(new Date(txn.subscription.endDate), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        {txn.subscription.status === 'ACTIVE' ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                                                ✓ Active
                                            </span>
                                        ) : txn.subscription.status === 'PENDING_PAYMENT' ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm">
                                                ⏱ Pending Payment
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm">
                                                {txn.subscription.status.replace('_', ' ')}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

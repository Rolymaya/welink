'use client';
import { buildApiUrl } from '@/lib/apiUrl';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, ExternalLink } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Subscription {
    id: string;
    organization: {
        name: string;
    };
    package: {
        name: string;
        price: number;
    };
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT';
    paymentProofUrl?: string;
}

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING_PAYMENT'>('ALL');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const { user, loading: authLoading } = useAuth('SUPER_ADMIN');

    useEffect(() => {
        if (!authLoading && user) {
            fetchSubscriptions();
        }
    }, [authLoading, user]);

    const fetchSubscriptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl('/subscriptions'), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSubscriptions(data);
            } else {
                console.error('Failed to fetch subscriptions');
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl(`/subscriptions/${id}/approve`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'ACTIVE' }),
            });

            if (response.ok) {
                toast.success('Subscription approved successfully!');
                fetchSubscriptions();
            } else {
                toast.error('Failed to approve subscription');
            }
        } catch (error) {
            console.error('Error approving subscription:', error);
            toast.error('An error occurred while approving');
        }
    };

    const handleReject = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl(`/subscriptions/${id}/approve`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'CANCELLED' }),
            });

            if (response.ok) {
                toast.success('Subscription rejected');
                fetchSubscriptions();
            } else {
                toast.error('Failed to reject subscription');
            }
        } catch (error) {
            console.error('Error rejecting subscription:', error);
            toast.error('An error occurred while rejecting');
        }
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        // Filter by status
        if (filter !== 'ALL' && sub.status !== filter) return false;

        // Filter by date range
        const subDate = new Date(sub.startDate);
        if (startDate && isBefore(subDate, startOfDay(new Date(startDate)))) return false;
        if (endDate && isAfter(subDate, endOfDay(new Date(endDate)))) return false;

        return true;
    });

    if (authLoading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <p>Verificando autenticação...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                    <p className="text-muted-foreground">Manage organization subscriptions and payments.</p>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4">
                            {/* Date Filters */}
                            <div className="flex gap-4 items-end">
                                <div className="w-48">
                                    <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="w-48">
                                    <Label htmlFor="endDate" className="text-xs">End Date</Label>
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
                                        Clear Dates
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
                                    All
                                </Button>
                                <Button
                                    variant={filter === 'PENDING_PAYMENT' ? 'default' : 'outline'}
                                    onClick={() => setFilter('PENDING_PAYMENT')}
                                    size="sm"
                                >
                                    Pending Payment
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-md border shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Package</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment Proof</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredSubscriptions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No subscriptions found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredSubscriptions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.organization.name}</TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{sub.package.name}</div>
                                            <div className="text-xs font-semibold text-blue-600">
                                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(sub.package.price)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                Start: {format(new Date(sub.startDate), 'dd/MM/yyyy')}
                                            </div>
                                            <div className="text-xs">
                                                End: {format(new Date(sub.endDate), 'dd/MM/yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {sub.status === 'ACTIVE' ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                                                    ✓ Active
                                                </span>
                                            ) : sub.status === 'PENDING_PAYMENT' ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm">
                                                    ⏱ Pending
                                                </span>
                                            ) : sub.status === 'EXPIRED' ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
                                                    ✕ Expired
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm">
                                                    {sub.status.replace('_', ' ')}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {sub.paymentProofUrl ? (
                                                <a
                                                    href={buildApiUrl(`"${sub.paymentProofUrl}`)}
                                                    download
                                                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                                >
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    Download
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-xs">No proof</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {sub.status === 'PENDING_PAYMENT' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" onClick={() => handleApprove(sub.id)} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm">
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button size="sm" onClick={() => handleReject(sub.id)} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm">
                                                        <X className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
}

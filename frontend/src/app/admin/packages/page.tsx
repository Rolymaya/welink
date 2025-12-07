'use client';
import { buildApiUrl } from '@/lib/apiUrl';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Package {
    id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    maxAgents: number;
    maxSessions: number;
    maxContacts: number;
    allowAudioResponse: boolean;
    allowScheduling: boolean;
    isActive: boolean;
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth('SUPER_ADMIN');

    useEffect(() => {
        if (!authLoading && user) {
            fetchPackages();
        }
    }, [authLoading, user]);

    const fetchPackages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl(''), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setPackages(data);
            } else {
                console.error('Failed to fetch packages');
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl(`"/packages/${id}`)), {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                fetchPackages();
            } else {
                alert('Failed to delete package');
            }
        } catch (error) {
            console.error('Error deleting package:', error);
        }
    };

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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Packages</h1>
                        <p className="text-muted-foreground">Manage subscription plans and limits.</p>
                    </div>
                    <Link href="/admin/packages/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Package
                        </Button>
                    </Link>
                </div>

                <div className="rounded-md border shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Limits (Agents/Sessions/Contacts)</TableHead>
                                <TableHead>Features</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : packages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">No packages found.</TableCell>
                                </TableRow>
                            ) : (
                                packages.map((pkg) => (
                                    <TableRow key={pkg.id}>
                                        <TableCell className="font-medium">
                                            {pkg.name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-blue-600">
                                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(pkg.price)}
                                            </span>
                                        </TableCell>
                                        <TableCell>{pkg.durationDays} days</TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm font-semibold">
                                                {pkg.maxAgents} / {pkg.maxSessions} / {pkg.maxContacts}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <span title="Audio Response" className={pkg.allowAudioResponse ? 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700' : 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400'}>
                                                    Audio
                                                </span>
                                                <span title="Scheduling" className={pkg.allowScheduling ? 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700' : 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400'}>
                                                    Schedule
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {pkg.isActive ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                                                    ✓ Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm">
                                                    ✕ Inactive
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/admin/packages/${pkg.id}/edit`}>
                                                    <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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

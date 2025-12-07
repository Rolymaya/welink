import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export function LLMProviderTable({ providers, onUpdate, onEdit }: { providers: any[], onUpdate: () => void, onEdit: (provider: any) => void }) {
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/super-admin/providers/${id}`);
            toast.success('Provider deleted');
            onUpdate();
        } catch (error) {
            toast.error('Failed to delete provider');
        }
    };

    return (
        <div className="rounded-md border shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Models</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {providers.map((provider) => (
                        <TableRow key={provider.id}>
                            <TableCell className="font-medium">{provider.name}</TableCell>
                            <TableCell>
                                <span className="font-mono text-sm text-gray-600">{provider.models}</span>
                            </TableCell>
                            <TableCell>
                                {provider.isActive ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                                        ✓ Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm">
                                        ✕ Inactive
                                    </span>
                                )}
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                    {provider.priority}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="mr-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEdit(provider)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(provider.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

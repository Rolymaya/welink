'use client';

import { buildApiUrl } from '@/lib/apiUrl';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditPackagePage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        durationDays: 30,
        maxAgents: 1,
        maxSessions: 1,
        maxContacts: 100,
        allowAudioResponse: false,
        allowScheduling: false,
        isActive: true,
    });

    useEffect(() => {
        fetchPackage();
    }, []);

    const fetchPackage = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl(`/packages/${params.id}`), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setFormData({
                    name: data.name,
                    description: data.description || '',
                    price: Number(data.price),
                    durationDays: data.durationDays,
                    maxAgents: data.maxAgents,
                    maxSessions: data.maxSessions,
                    maxContacts: data.maxContacts,
                    allowAudioResponse: data.allowAudioResponse,
                    allowScheduling: data.allowScheduling,
                    isActive: data.isActive,
                });
            } else {
                toast.error('Falha ao carregar detalhes do pacote');
                router.push('/admin/packages');
            }
        } catch (error) {
            console.error('Error fetching package:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl(`/packages/${params.id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success('Pacote atualizado com sucesso!');
                router.push('/admin/packages');
            } else {
                const errorData = await response.json().catch(() => null);
                console.error('Update failed:', response.status, errorData);
                toast.error(errorData?.message || 'Falha ao atualizar pacote');
            }
        } catch (error) {
            console.error('Error updating package:', error);
            toast.error('Erro ao atualizar pacote');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <p>Loading...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/packages">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Package</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 border p-6 rounded-lg bg-white dark:bg-gray-800">
                    <div className="space-y-2">
                        <Label htmlFor="name">Package Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (AOA)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="durationDays">Duration (Days)</Label>
                            <Input
                                id="durationDays"
                                name="durationDays"
                                type="number"
                                min="1"
                                value={formData.durationDays}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxAgents">Max Agents</Label>
                            <Input
                                id="maxAgents"
                                name="maxAgents"
                                type="number"
                                min="1"
                                value={formData.maxAgents}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxSessions">Max Sessions</Label>
                            <Input
                                id="maxSessions"
                                name="maxSessions"
                                type="number"
                                min="1"
                                value={formData.maxSessions}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxContacts">Max Contacts</Label>
                            <Input
                                id="maxContacts"
                                name="maxContacts"
                                type="number"
                                min="1"
                                value={formData.maxContacts}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Features</h3>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allowAudioResponse"
                                checked={formData.allowAudioResponse}
                                onCheckedChange={(checked) => handleCheckboxChange('allowAudioResponse', checked as boolean)}
                            />
                            <Label htmlFor="allowAudioResponse">Allow Audio Response (Whisper)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allowScheduling"
                                checked={formData.allowScheduling}
                                onCheckedChange={(checked) => handleCheckboxChange('allowScheduling', checked as boolean)}
                            />
                            <Label htmlFor="allowScheduling">Allow Scheduling</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => handleCheckboxChange('isActive', checked as boolean)}
                            />
                            <Label htmlFor="isActive">Active (Visible to customers)</Label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

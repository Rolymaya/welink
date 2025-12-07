import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { toast } from 'sonner';

export function LLMProviderForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: any }) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        apiKey: initialData?.apiKey || '',
        baseUrl: initialData?.baseUrl || '',
        models: initialData?.models || '',
        priority: initialData?.priority || 0,
        isActive: initialData?.isActive ?? true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                models: formData.models, // Send as string
                priority: Number(formData.priority),
            };

            if (initialData?.id) {
                await api.patch(`/super-admin/providers/${initialData.id}`, payload);
                toast.success('Provider updated successfully');
            } else {
                await api.post('/super-admin/providers', payload);
                toast.success('Provider created successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(initialData?.id ? 'Failed to update provider' : 'Failed to create provider');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Provider Name</Label>
                <Input
                    id="name"
                    placeholder="e.g. OpenAI"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>
            <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    required
                />
            </div>
            <div>
                <Label htmlFor="baseUrl">Base URL (Optional)</Label>
                <Input
                    id="baseUrl"
                    placeholder="https://api.openai.com/v1"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                />
            </div>
            <div>
                <Label htmlFor="models">Models (comma separated)</Label>
                <Input
                    id="models"
                    placeholder="gpt-4, gpt-3.5-turbo"
                    value={formData.models}
                    onChange={(e) => setFormData({ ...formData, models: e.target.value })}
                    required
                />
            </div>
            <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                />
            </div>
            <div className="flex items-center space-x-2">
                <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
            </div>
            <Button type="submit" className="w-full">{initialData ? 'Update Provider' : 'Create Provider'}</Button>
        </form>
    );
}

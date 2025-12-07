'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfilePhotoUpload } from '@/components/profile-photo-upload';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Save, User, Lock, Mail } from 'lucide-react';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profilePhoto, setProfilePhoto] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const response = await api.get('/auth/profile');
            setName(response.data.name || '');
            setEmail(response.data.email || '');
            setProfilePhoto(response.data.profilePhoto || '');
        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Erro ao carregar perfil');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (newPassword && newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        setSaving(true);
        try {
            const data: any = { name };
            if (newPassword) {
                data.password = newPassword;
            }
            // profilePhoto is handled by the upload component directly, but we can send it here too if needed
            // Actually, the upload component updates the DB directly, so we just need to update name/password here.
            // But if the user uploaded a photo but didn't save, it's already saved. That's fine for now.
            // Wait, the upload component updates the DB immediately.

            await api.post('/auth/profile', data);

            toast.success('Perfil atualizado com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
            loadProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Meu Perfil</h2>
                <p className="text-muted-foreground">Gerencie suas informações pessoais e segurança.</p>
            </div>

            <Card className="relative overflow-hidden border-t-4 border-t-purple-500">
                <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>Atualize sua foto e dados de identificação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <ProfilePhotoUpload
                            value={profilePhoto}
                            onChange={setProfilePhoto}
                            onUploadSuccess={loadProfile}
                        />
                        <p className="text-sm text-muted-foreground">Clique na foto para alterar</p>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input id="email" value={email} disabled className="pl-9 bg-gray-50" />
                            </div>
                            <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Segurança</CardTitle>
                    <CardDescription>Alterar sua senha de acesso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nova Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </div>
    );
}

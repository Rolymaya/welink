'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BusinessHoursSelector } from '@/components/business-hours-selector';
import api from '@/lib/api';
import { toast } from 'sonner';

const DEFAULT_HOURS = {
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '09:00', close: '13:00', isOpen: true },
    sunday: { open: '09:00', close: '18:00', isOpen: false },
};

export default function ProfileOnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [hours, setHours] = useState(DEFAULT_HOURS);

    async function onSubmit() {
        setLoading(true);
        try {
            await api.patch('/organization/profile', {
                businessHours: hours,
            });
            toast.success('Horários salvos com sucesso!');
            router.push('/onboarding/complete');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Erro ao salvar horários. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Horário de Funcionamento</h2>
                <p className="text-sm text-gray-500">Defina quando sua empresa está aberta para atendimento.</p>
            </div>

            <BusinessHoursSelector value={hours} onChange={setHours} />

            <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => router.back()}>
                    Voltar
                </Button>
                <Button onClick={onSubmit} disabled={loading}>
                    {loading ? 'Salvando...' : 'Continuar'}
                </Button>
            </div>
        </div>
    );
}

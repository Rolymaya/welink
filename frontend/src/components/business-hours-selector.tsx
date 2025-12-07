'use client';
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface BusinessHours {
    [key: string]: {
        open: string;
        close: string;
        isOpen: boolean;
    };
}

interface BusinessHoursSelectorProps {
    value: any;
    onChange: (value: any) => void;
}

const DAYS = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
];

export function BusinessHoursSelector({ value, onChange }: BusinessHoursSelectorProps) {
    const handleToggle = (day: string, isOpen: boolean) => {
        onChange({
            ...value,
            [day]: { ...value[day], isOpen },
        });
    };

    const handleTimeChange = (day: string, type: 'open' | 'close', time: string) => {
        onChange({
            ...value,
            [day]: { ...value[day], [type]: time },
        });
    };

    return (
        <div className="space-y-4">
            {DAYS.map(({ key, label }) => {
                const dayConfig = value[key] || { open: '09:00', close: '18:00', isOpen: true };

                return (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-4">
                            <Switch
                                checked={dayConfig.isOpen}
                                onCheckedChange={(checked) => handleToggle(key, checked)}
                            />
                            <Label className="w-24">{label}</Label>
                        </div>

                        {dayConfig.isOpen && (
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="time"
                                    value={dayConfig.open}
                                    onChange={(e) => handleTimeChange(key, 'open', e.target.value)}
                                    className="w-24"
                                />
                                <span>às</span>
                                <Input
                                    type="time"
                                    value={dayConfig.close}
                                    onChange={(e) => handleTimeChange(key, 'close', e.target.value)}
                                    className="w-24"
                                />
                            </div>
                        )}

                        {!dayConfig.isOpen && (
                            <span className="text-sm text-gray-500 italic">Fechado</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

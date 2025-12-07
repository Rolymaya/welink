'use client';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, User } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ProfilePhotoUploadProps {
    value?: string;
    onChange: (value: string) => void;
    onUploadSuccess?: () => void;
}

export function ProfilePhotoUpload({ value, onChange, onUploadSuccess }: ProfilePhotoUploadProps) {
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/auth/profile/photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // The backend returns the updated user object, which contains profilePhoto
            onChange(response.data.profilePhoto);
            toast.success('Foto de perfil atualizada!');

            // Dispatch event to notify other components
            window.dispatchEvent(new Event('profileUpdated'));

            // Call the callback to reload profile data
            if (onUploadSuccess) {
                onUploadSuccess();
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error('Erro ao enviar foto. Tente novamente.');
        } finally {
            setUploading(false);
        }
    }, [onChange, onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.svg'],
        },
        maxFiles: 1,
        multiple: false,
    });

    const removePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Ideally we should also call an API to remove the photo, but for now just clearing frontend state
        // or we can update profile with null photo
        onChange('');
    };

    return (
        <div className="w-full flex justify-center">
            <div
                {...getRootProps()}
                className={`relative w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                    }`}
            >
                <input {...getInputProps()} />

                {value ? (
                    <>
                        <Image
                            src={value}
                            alt="Foto de perfil"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white text-xs font-medium">Alterar</p>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        {uploading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        ) : (
                            <User className="h-10 w-10 mb-1" />
                        )}
                        <span className="text-[10px]">{uploading ? '...' : 'Foto'}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

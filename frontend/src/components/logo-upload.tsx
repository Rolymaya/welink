'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';

interface LogoUploadProps {
    value?: string;
    onChange: (value: string) => void;
    onFileSelect?: (file: File) => void;
}

export function LogoUpload({ value, onChange, onFileSelect }: LogoUploadProps) {
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (onFileSelect) {
            // Manual handling (e.g. for registration form)
            const previewUrl = URL.createObjectURL(file);
            onChange(previewUrl);
            onFileSelect(file);
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/organization/logo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onChange(response.data.logo);
            toast.success('Logotipo enviado com sucesso!');
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Erro ao enviar logotipo. Tente novamente.');
        } finally {
            setUploading(false);
        }
    }, [onChange, onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.svg'],
        },
        maxFiles: 1,
        multiple: false,
    });

    const removeLogo = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                    }`}
            >
                <input {...getInputProps()} />

                {value ? (
                    <div className="relative w-32 h-32">
                        <Image
                            src={value}
                            alt="Logo da empresa"
                            fill
                            className="object-contain"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={removeLogo}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Upload className="h-6 w-6 text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                            {uploading ? 'Enviando...' : 'Clique para enviar ou arraste o arquivo'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG ou SVG (max. 2MB)
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

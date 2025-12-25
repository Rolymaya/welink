'use client';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl } from '@/lib/apiUrl';

interface ProductImageUploadProps {
    value?: string;
    onChange: (value: string) => void;
}

export function ProductImageUpload({ value, onChange }: ProductImageUploadProps) {
    const { token } = useAuth();
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(buildApiUrl('/storage/upload'), {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao enviar imagem');
            }

            const data = await response.json();
            onChange(data.url);
            toast.success('Imagem carregada com sucesso!');
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error(error.message || 'Erro ao enviar imagem. Tente novamente.');
        } finally {
            setUploading(false);
        }
    }, [onChange, token]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
        },
        maxFiles: 1,
        multiple: false,
    });

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`relative w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-muted/30 ${isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-muted-foreground/20 hover:border-blue-400 hover:bg-muted/50'
                    }`}
            >
                <input {...getInputProps()} />

                {value ? (
                    <>
                        <img
                            src={value}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <p className="text-white text-sm font-medium flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Alterar Imagem
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                            onClick={removeImage}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                                <span className="text-sm font-medium text-blue-500">Enviando...</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 rounded-full bg-blue-50 text-blue-500 mb-3">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold">Clique ou arraste a imagem</p>
                                    <p className="text-xs">PNG, JPG ou WebP (máx. 5MB)</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

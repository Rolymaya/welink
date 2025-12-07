'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Globe, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function NewKnowledgeBasePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('file');

    // File State
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');

    // URL State
    const [urlName, setUrlName] = useState('');
    const [url, setUrl] = useState('');

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles[0]) {
            setFile(acceptedFiles[0]);
            setFileName(acceptedFiles[0].name.split('.')[0]);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
        },
        maxFiles: 1,
    });

    const handleFileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !fileName) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', fileName);

        try {
            await api.post('/knowledge/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Arquivo enviado para processamento!');
            router.push('/company/knowledge');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Erro ao enviar arquivo');
        } finally {
            setLoading(false);
        }
    };

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !urlName) return;

        setLoading(true);
        try {
            await api.post('/knowledge/url', {
                name: urlName,
                url: url,
            });
            toast.success('URL adicionada para processamento!');
            router.push('/company/knowledge');
        } catch (error) {
            console.error('URL error:', error);
            toast.error('Erro ao adicionar URL');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Adicionar Conhecimento</h1>
                <p className="text-gray-500 mt-2">Escolha como deseja treinar seus agentes.</p>
            </div>

            <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">
                        <FileText className="mr-2 h-4 w-4" />
                        Arquivo
                    </TabsTrigger>
                    <TabsTrigger value="url">
                        <Globe className="mr-2 h-4 w-4" />
                        Website
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="file">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload de Arquivo</CardTitle>
                            <CardDescription>
                                Suporta PDF, DOCX e TXT. Máximo 10MB.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleFileSubmit} className="space-y-6">
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    {file ? (
                                        <div className="text-center">
                                            <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                                            <p className="font-medium text-gray-900">{file.name}</p>
                                            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <Button variant="link" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-red-500 mt-2">
                                                Remover
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-12 w-12 text-gray-400 mb-4" />
                                            <p className="font-medium text-gray-900">Clique ou arraste o arquivo aqui</p>
                                        </>
                                    )}
                                </div>

                                {file && (
                                    <div className="space-y-2">
                                        <Label htmlFor="fileName">Nome do Documento</Label>
                                        <Input
                                            id="fileName"
                                            value={fileName}
                                            onChange={(e) => setFileName(e.target.value)}
                                            placeholder="Ex: Manual de Vendas 2024"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end space-x-4">
                                    <Button variant="outline" type="button" onClick={() => router.back()}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={loading || !file}>
                                        {loading ? 'Enviando...' : 'Processar Arquivo'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="url">
                    <Card>
                        <CardHeader>
                            <CardTitle>Adicionar Website</CardTitle>
                            <CardDescription>
                                Importe conteúdo de uma página web pública.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUrlSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="url">URL da Página</Label>
                                    <Input
                                        id="url"
                                        type="url"
                                        placeholder="https://exemplo.com/sobre"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="urlName">Nome Identificador</Label>
                                    <Input
                                        id="urlName"
                                        placeholder="Ex: Página Sobre Nós"
                                        value={urlName}
                                        onChange={(e) => setUrlName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <Button variant="outline" type="button" onClick={() => router.back()}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={loading || !url || !urlName}>
                                        {loading ? 'Adicionando...' : 'Processar URL'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

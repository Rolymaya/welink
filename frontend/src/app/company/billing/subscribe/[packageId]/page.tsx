'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface Package {
    id: string;
    name: string;
    price: number;
    description: string;
}

export default function SubscribePage() {
    const params = useParams();
    const router = useRouter();
    const [pkg, setPkg] = useState<Package | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const [settings, setSettings] = useState<any>(null);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<string>('');

    useEffect(() => {
        fetchPackage();
        fetchBankAccounts();
    }, []);

    const fetchBankAccounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/bank-accounts/active', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setBankAccounts(data);
            }
        } catch (error) {
            console.error('Error fetching bank accounts:', error);
        }
    };

    const fetchPackage = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/packages/${params.packageId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setPkg(data);
            } else {
                toast.error('Failed to fetch package details');
                router.push('/company/billing/upgrade');
            }
        } catch (error) {
            console.error('Error fetching package:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please upload a payment proof');
            return;
        }
        if (!selectedBankId) {
            toast.error('Por favor selecione um banco');
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('packageId', params.packageId as string);
            formData.append('bankAccountId', selectedBankId);
            formData.append('proof', file);

            const response = await fetch('http://localhost:3001/subscriptions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                toast.success('Subscription request submitted successfully! Waiting for approval.');
                router.push('/company/billing');
            } else {
                const errorData = await response.json();
                toast.error(`Failed to submit subscription: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting subscription:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p>Carregando detalhes do plano...</p>
            </div>
        );
    }

    if (!pkg) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/company/billing/upgrade">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finalizar Subscrição</h1>
                    <p className="text-muted-foreground">Efetue o pagamento e envie o comprovativo.</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-purple-500/20">
                    <CardHeader>
                        <CardTitle>Resumo do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="font-medium">{pkg.name}</span>
                            <span className="font-bold text-lg">
                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(pkg.price)}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{pkg.description}</p>
                    </CardContent>
                </Card>

                <Card className="border-purple-500/20">
                    <CardHeader>
                        <CardTitle>Dados Bancários</CardTitle>
                        <CardDescription>Selecione o banco e faça a transferência:</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bankSelect">Selecione o Banco *</Label>
                            <select
                                id="bankSelect"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedBankId}
                                onChange={(e) => setSelectedBankId(e.target.value)}
                                required
                            >
                                <option value="">-- Selecione um banco --</option>
                                {bankAccounts.map((bank) => (
                                    <option key={bank.id} value={bank.id}>
                                        {bank.bankName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedBankId && bankAccounts.find(b => b.id === selectedBankId) && (
                            <div className="p-4 bg-muted rounded-lg space-y-2 animate-in fade-in-50 duration-300">
                                {(() => {
                                    const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
                                    return (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Banco:</span>
                                                <span className="font-medium">{selectedBank.bankName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Titular:</span>
                                                <span className="font-medium">{selectedBank.accountHolder}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">IBAN:</span>
                                                <span className="font-mono font-medium">{selectedBank.iban}</span>
                                            </div>
                                            {selectedBank.swift && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">SWIFT/BIC:</span>
                                                    <span className="font-mono font-medium">{selectedBank.swift}</span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {!selectedBankId && bankAccounts.length === 0 && (
                            <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                                Carregando bancos disponíveis...
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Comprovativo de Pagamento</CardTitle>
                        <CardDescription>Envie uma foto ou PDF do comprovativo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="proof">Ficheiro</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="proof"
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Formatos aceites: JPG, PNG, PDF. Máx 5MB.</p>
                            </div>

                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={submitting}>
                                {submitting ? (
                                    'Enviando...'
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Confirmar Pagamento
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

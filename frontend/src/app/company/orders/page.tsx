'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl } from '@/lib/apiUrl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PageHeader, PAGE_ANIMATION } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { Check, X, Eye, Package, Truck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
    id: string;
    quantity: number;
    priceAtTime: number;
    productNameSnapshot: string;
    product: {
        name: string;
        imageUrl?: string;
    };
}

interface Order {
    id: string;
    status: string;
    totalAmount: number;
    deliveryAddress: string;
    rejectionReason?: string;
    createdAt: string;
    contact: {
        name: string;
        phone: string;
    };
    items: OrderItem[];
}

const statusConfig = {
    PENDING: { label: 'Pendente', variant: 'secondary' as const, icon: Package },
    AWAITING_PAYMENT: { label: 'Aguardando Pagamento', variant: 'default' as const, icon: Package },
    PROCESSING: { label: 'Em Processamento', variant: 'default' as const, icon: Package },
    SHIPPED: { label: 'Enviado', variant: 'default' as const, icon: Truck },
    COMPLETED: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle2 },
    REJECTED: { label: 'Rejeitado', variant: 'destructive' as const, icon: X },
};

export default function OrdersPage() {
    const { token } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token, statusFilter]);

    const fetchOrders = async () => {
        if (!token) return;
        try {
            const url = statusFilter === 'all'
                ? buildApiUrl('/orders')
                : buildApiUrl(`/orders?status=${statusFilter}`);

            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Erro ao carregar pedidos');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, status: string, reason?: string) => {
        try {
            const res = await fetch(buildApiUrl(`/orders/${orderId}/status`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status,
                    rejectionReason: reason,
                }),
            });

            if (res.ok) {
                toast.success('Status atualizado!');
                setActionDialog(null);
                setRejectionReason('');
                setDetailsOpen(false);
                fetchOrders();
            } else {
                const errorData = await res.text();
                console.error('Failed to update status:', res.status, errorData);
                toast.error(`Erro ao atualizar: ${res.status} - ${errorData}`);
            }
        } catch (error) {
            console.error('Network/Code error:', error);
            toast.error('Erro de conexão ou execução');
        }
    };

    const openDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsOpen(true);
    };

    const handleApprove = () => {
        if (selectedOrder) {
            handleStatusUpdate(selectedOrder.id, 'AWAITING_PAYMENT');
        }
    };

    const handleReject = () => {
        if (selectedOrder && rejectionReason.trim()) {
            handleStatusUpdate(selectedOrder.id, 'REJECTED', rejectionReason);
        } else {
            toast.error('Por favor, informe o motivo da rejeição');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    return (
        <div className={cn("container mx-auto p-4 md:p-8 space-y-8", PAGE_ANIMATION)}>
            <PageHeader
                title="Encomendas"
                description="Gerencie os pedidos dos clientes e acompanhe o status de venda"
            >
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px] border-none bg-card/50 backdrop-blur-sm shadow-sm h-11 rounded-2xl">
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                        <SelectItem value="all">Todos os Pedidos</SelectItem>
                        <SelectItem value="PENDING">Pendentes</SelectItem>
                        <SelectItem value="AWAITING_PAYMENT">Aguardando Pagamento</SelectItem>
                        <SelectItem value="PROCESSING">Em Processamento</SelectItem>
                        <SelectItem value="SHIPPED">Enviados</SelectItem>
                        <SelectItem value="COMPLETED">Concluídos</SelectItem>
                        <SelectItem value="REJECTED">Rejeitados</SelectItem>
                    </SelectContent>
                </Select>
            </PageHeader>

            <div className="bg-card rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => {
                            const config = statusConfig[order.status as keyof typeof statusConfig];
                            const Icon = config?.icon;
                            return (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-sm">
                                        #{order.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>{order.contact.name || 'Sem nome'}</TableCell>
                                    <TableCell>{order.contact.phone}</TableCell>
                                    <TableCell className="font-semibold">
                                        {order.totalAmount.toLocaleString('pt-AO')} Kz
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={config?.variant}>
                                            {Icon && <Icon className="mr-1 h-3 w-3" />}
                                            {config?.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openDetails(order)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Order Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Pedido #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
                        <DialogDescription>
                            {selectedOrder && statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Cliente</Label>
                                    <p className="text-sm font-medium">{selectedOrder.contact.name || 'Sem nome'}</p>
                                </div>
                                <div>
                                    <Label>Telefone</Label>
                                    <p className="text-sm font-medium">{selectedOrder.contact.phone}</p>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div>
                                <Label>Endereço de Entrega</Label>
                                <p className="text-sm mt-1">{selectedOrder.deliveryAddress}</p>
                            </div>

                            {/* Order Items */}
                            <div>
                                <Label>Itens do Pedido</Label>
                                <div className="mt-2 space-y-2">
                                    {selectedOrder.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                                            <div className="flex items-center gap-3">
                                                {item.product.imageUrl && (
                                                    <img
                                                        src={item.product.imageUrl}
                                                        alt={item.productNameSnapshot}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium">{item.productNameSnapshot}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Quantidade: {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-semibold">
                                                {(item.priceAtTime * item.quantity).toLocaleString('pt-AO')} Kz
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center pt-4 border-t">
                                <span className="text-lg font-semibold">Total</span>
                                <span className="text-2xl font-bold">
                                    {selectedOrder.totalAmount.toLocaleString('pt-AO')} Kz
                                </span>
                            </div>

                            {/* Rejection Reason */}
                            {selectedOrder.rejectionReason && (
                                <div className="p-4 bg-destructive/10 border border-destructive rounded">
                                    <Label>Motivo da Rejeição</Label>
                                    <p className="text-sm mt-1">{selectedOrder.rejectionReason}</p>
                                </div>
                            )}

                            {/* Actions */}
                            {selectedOrder.status === 'PENDING' && (
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1"
                                        onClick={() => setActionDialog('approve')}
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Aprovar Pedido
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => setActionDialog('reject')}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Rejeitar Pedido
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Rejection Dialog */}
            <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar Pedido</DialogTitle>
                        <DialogDescription>
                            Informe o motivo da rejeição para o cliente
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder="Ex: Produto fora de estoque, Endereço fora da área de entrega..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleReject}>
                            Confirmar Rejeição
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approval Confirmation */}
            <Dialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Aprovar Pedido</DialogTitle>
                        <DialogDescription>
                            O cliente receberá uma mensagem com os dados bancários para pagamento
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleApprove}>
                            Confirmar Aprovação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

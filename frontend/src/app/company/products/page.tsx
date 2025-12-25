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
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Package, Search, Filter, MoreVertical, Power, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProductImageUpload } from '@/components/product-image-upload';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader, PAGE_ANIMATION } from '@/components/page-header';
import { cn } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category?: string;
    isPhysical: boolean;
    stock?: number;
    isActive: boolean;
    createdAt: string;
}

export default function ProductsPage() {
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        category: '',
        isPhysical: true,
        stock: 0,
    });

    useEffect(() => {
        if (token) {
            fetchProducts();
        }
    }, [token]);

    const fetchProducts = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(buildApiUrl('/products?includeInactive=true'), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Erro ao carregar produtos');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingProduct
                ? buildApiUrl(`/products/${editingProduct.id}`)
                : buildApiUrl('/products');

            const method = editingProduct ? 'PATCH' : 'POST';

            // Ensure proper data types
            const payload = {
                ...formData,
                price: Number(formData.price),
                stock: formData.isPhysical ? Number(formData.stock) : undefined,
                imageUrl: formData.imageUrl || undefined,
                category: formData.category || undefined,
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(editingProduct ? 'Produto atualizado!' : 'Produto criado!');
                setDialogOpen(false);
                resetForm();
                fetchProducts();
            } else {
                const error = await res.json();
                console.error('API Error:', error);
                toast.error(error.message || 'Erro ao salvar produto');
            }
        } catch (error) {
            console.error('Request Error:', error);
            toast.error('Erro ao salvar produto');
        }
    };

    const toggleStatus = async (product: Product) => {
        const action = product.isActive ? 'desativar' : 'ativar';
        if (!confirm(`Deseja ${action} este produto?`)) return;

        try {
            const url = buildApiUrl(`/products/${product.id}`);
            const res = await fetch(url, {
                method: product.isActive ? 'DELETE' : 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: !product.isActive ? JSON.stringify({ isActive: true }) : undefined,
            });

            if (res.ok) {
                toast.success(product.isActive ? 'Produto desativado!' : 'Produto ativado!');
                fetchProducts();
            }
        } catch (error) {
            toast.error(`Erro ao ${action} produto`);
        }
    };

    const openEditDialog = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl || '',
            category: product.category || '',
            isPhysical: product.isPhysical,
            stock: product.stock || 0,
        });
        setDialogOpen(true);
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: 0,
            imageUrl: '',
            category: '',
            isPhysical: true,
            stock: 0,
        });
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Carregando catálogo...</p>
            </div>
        );
    }

    return (
        <div className={cn("container mx-auto p-4 md:p-8 space-y-8", PAGE_ANIMATION)}>
            <PageHeader
                title="Catálogo de Produtos"
                description="Gerencie seus itens físicos e digitais com facilidade"
            >
                <Button
                    onClick={() => { resetForm(); setDialogOpen(true); }}
                    size="lg"
                    className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Adicionar Produto
                </Button>
            </PageHeader>

            <div className="flex flex-col md:flex-row gap-4 items-center bg-card/50 backdrop-blur-sm p-4 rounded-2xl border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar por nome ou categoria..."
                        className="pl-10 h-11 bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 bg-background/50 border-none">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <Card
                        key={product.id}
                        className={`group relative overflow-hidden border border-muted/20 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-3xl bg-card p-0 flex flex-col ${!product.isActive ? 'opacity-70 saturate-[0.5]' : ''
                            }`}
                    >
                        <div className="aspect-[16/10] relative overflow-hidden w-full">
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors duration-500">
                                    <Package className="h-16 w-16 text-blue-400/50" />
                                </div>
                            )}

                            {/* Badges Overlay */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {!product.isActive && (
                                    <Badge variant="secondary" className="backdrop-blur-xl bg-background/60 shadow-lg border-none text-[10px] uppercase tracking-wider font-bold">
                                        Inativo
                                    </Badge>
                                )}
                                <Badge
                                    className={`backdrop-blur-xl shadow-lg border-none font-bold text-[10px] uppercase tracking-wider ${product.isPhysical
                                        ? 'bg-blue-500/80 text-white'
                                        : 'bg-purple-500/80 text-white'
                                        }`}
                                >
                                    {product.isPhysical ? 'Físico' : 'Digital'}
                                </Badge>
                            </div>

                            <div className="absolute bottom-3 right-3">
                                <div className="px-3 py-1.5 rounded-xl bg-primary/95 shadow-lg text-white font-bold text-sm border border-white/10">
                                    {product.price.toLocaleString('pt-AO')} Kz
                                </div>
                            </div>

                            {/* Quick Actions Overlay */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-10 w-10 rounded-2xl shadow-xl bg-background/80 backdrop-blur-md border border-white/20">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 bg-background/95 backdrop-blur-xl">
                                        <DropdownMenuItem onClick={() => openEditDialog(product)} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                                                <Edit className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold">Editar Produto</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toggleStatus(product)} className={`${product.isActive ? 'text-destructive' : 'text-emerald-600'} flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-muted transition-colors mt-1`}>
                                            <div className={`p-2 rounded-lg ${product.isActive ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                                                {product.isActive ? <Trash2 className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                            </div>
                                            <span className="font-semibold">{product.isActive ? 'Desativar Produto' : 'Ativar Produto'}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1 gap-3">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors duration-300">
                                    {product.name}
                                </h3>
                                <div className="flex items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-md border border-muted-foreground/5">
                                        {product.category || 'Sem categoria'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto">
                                {product.isPhysical ? (
                                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/20 border border-muted-foreground/5">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1.5 w-1.5 rounded-full ${product.stock && product.stock > 5
                                                ? 'bg-emerald-500'
                                                : 'bg-red-500'
                                                }`} />
                                            <span className="text-[10px] font-semibold text-muted-foreground">Estoque</span>
                                        </div>
                                        <span className={`text-[11px] font-bold ${product.stock && product.stock > 5 ? 'text-emerald-600' : 'text-red-600'
                                            }`}>
                                            {product.stock || 0} un.
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-primary/5 border border-primary/10 w-full">
                                        <CheckCircle2 className="h-3 w-3 text-primary" />
                                        <span className="text-[10px] font-bold text-primary italic">Acesso Digital</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredProducts.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center p-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/10 text-center animate-in zoom-in duration-500">
                    <div className="p-4 rounded-full bg-muted/30 mb-4">
                        <Package className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-xl font-bold text-muted-foreground">Nenhum produto encontrado</h3>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                        Tente ajustar sua pesquisa ou adicione um novo produto ao catálogo.
                    </p>
                    <Button
                        variant="link"
                        onClick={() => setSearchTerm('')}
                        className="mt-4 text-primary font-bold"
                    >
                        Limpar filtros
                    </Button>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-3xl font-extrabold pb-1">
                            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Preencha os detalhes para {editingProduct ? 'atualizar' : 'criar'} seu produto no catálogo.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">
                                Imagem do Produto
                            </Label>
                            <ProductImageUpload
                                value={formData.imageUrl}
                                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                            />
                        </div>

                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="font-bold">Nome do Produto</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Teclado Mecânico RGB"
                                    className="h-12 border-muted-foreground/20 rounded-xl focus-visible:ring-primary/20"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description" className="font-bold">Descrição Detalhada</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descreva as características principais do seu produto..."
                                    className="border-muted-foreground/20 rounded-xl focus-visible:ring-primary/20 min-h-[120px]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="price" className="font-bold">Preço de Venda (Kz)</Label>
                                    <div className="relative">
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                            className="h-12 border-muted-foreground/20 rounded-xl focus-visible:ring-primary/20 pl-4 font-bold"
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category" className="font-bold">Categoria</Label>
                                    <Input
                                        id="category"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="Ex: Eletrônicos"
                                        className="h-12 border-muted-foreground/20 rounded-xl focus-visible:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-2xl border flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isPhysical" className="text-base font-bold">Produto Físico</Label>
                                        <p className="text-sm text-muted-foreground">Ative se o produto requer estoque e entrega.</p>
                                    </div>
                                    <Switch
                                        id="isPhysical"
                                        checked={formData.isPhysical}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isPhysical: checked })}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>

                                {formData.isPhysical && (
                                    <div className="grid gap-2 pt-2 animate-in slide-in-from-top-2 duration-300">
                                        <Label htmlFor="stock" className="font-bold">Quantidade em Estoque</Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                            className="h-12 border-muted-foreground/20 rounded-xl focus-visible:ring-primary/20 font-bold"
                                            min="0"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>

                    <DialogFooter className="p-6 border-t bg-muted/10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            className="h-12 px-8 rounded-xl font-bold"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
                        >
                            {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


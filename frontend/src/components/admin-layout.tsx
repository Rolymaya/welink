import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, Users, Bot, MessageSquare, Shield, LogOut, Package, CreditCard, Landmark, DollarSign } from 'lucide-react';
import { Button } from './ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/admin/login';
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-700 border-r border-blue-800 flex flex-col shadow-xl">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-white">SaaS AI</h1>
                    <p className="text-blue-100 text-sm mt-1">Admin Panel</p>
                </div>
                <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    <Link href="/admin/dashboard" className="flex items-center px-4 py-2 text-white hover:bg-white hover:text-blue-600 rounded-md transition-all">
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link href="/admin/tenants" className="flex items-center px-4 py-2 text-white hover:bg-white hover:text-blue-600 rounded-md transition-all">
                        <Users className="w-5 h-5 mr-3" />
                        Empresas
                    </Link>
                    <Link href="/admin/packages" className="flex items-center px-4 py-2 text-white hover:bg-white hover:text-blue-600 rounded-md transition-all">
                        <Package className="w-5 h-5 mr-3" />
                        Pacotes
                    </Link>
                    <Link href="/admin/subscriptions" className="flex items-center px-4 py-2 text-white hover:bg-white hover:text-blue-600 rounded-md transition-all">
                        <CreditCard className="w-5 h-5 mr-3" />
                        Subscrições
                    </Link>
                    <Link href="/admin/bank-accounts" className="flex items-center px-4 py-2 text-white hover:bg-white hover:text-blue-600 rounded-md transition-all">
                        <Landmark className="w-5 h-5 mr-3" />
                        Contas Bancárias
                    </Link>
                    <Link href="/admin/affiliates" className="flex items-center px-4 py-2 text-white hover:bg-white hover:text-blue-600 rounded-md transition-all">
                        <DollarSign className="w-5 h-5 mr-3" />
                        Gestão de Afiliados
                    </Link>
                    <Link href="/admin/llms" className="flex items-center px-4 py-2 text-white hover:bg-white hover:text-blue-600 rounded-md transition-all">
                        <Bot className="w-5 h-5 mr-3" />
                        Provedores IA
                    </Link>
                    <Link href="/admin/settings" className="flex items-center px-4 py-2 text-white hover:bg-white hover:text-blue-600 rounded-md transition-all">
                        <Settings className="w-5 h-5 mr-3" />
                        Configurações
                    </Link>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-white/20">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}

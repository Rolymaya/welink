'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Bot,
    Database,
    MessageSquare,
    Smartphone,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    Users,
    Calendar,
    CreditCard,
    FlaskConical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';
import { useEffect, useState } from 'react';

interface CompanyLayoutProps {
    children: React.ReactNode;
}

const MENU_ITEMS = [
    { href: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/company/agents', label: 'Agentes', icon: Bot },
    { href: '/company/whatsapp', label: 'WhatsApp', icon: Smartphone },
    { href: '/company/schedules', label: 'Agendamentos', icon: Calendar },
    { href: '/company/contacts', label: 'Contactos', icon: Users },
    { href: '/company/knowledge', label: 'Conhecimento', icon: Database },
    { href: '/company/playground/agents', label: 'Grátis', icon: FlaskConical },
    { href: '/company/billing', label: 'Planos', icon: CreditCard },
    { href: '/company/settings', label: 'Configurações', icon: Settings },
];

export default function CompanyLayout({ children }: CompanyLayoutProps) {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    const loadUserProfile = () => {
        api.get('/auth/profile').then(response => {
            setUser(response.data);
        }).catch(error => {
            console.error('Error fetching user profile:', error);
        });
    };

    useEffect(() => {
        loadUserProfile();

        // Listen for profile update events
        const handleProfileUpdate = () => {
            loadUserProfile();
        };

        window.addEventListener('profileUpdated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, []);

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-gradient-to-b from-blue-600 to-blue-700">
            <div className="p-6 border-b border-white/20">
                <h1 className="text-xl font-bold text-white">
                    WeLink AI
                </h1>
                <p className="text-xs text-blue-100 mt-1">Enterprise Edition</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {MENU_ITEMS.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                        <Link key={href} href={href}>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start transition-all duration-200 ${isActive
                                    ? 'bg-white text-blue-600 hover:bg-white/90 shadow-md'
                                    : 'text-white hover:bg-white hover:text-blue-600'
                                    }`}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {label}
                            </Button>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/20">
                <Link href="/company/profile" className="block">
                    <div className="flex items-center gap-3 mb-4 px-2 hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer">
                        <Avatar>
                            <AvatarImage src={user?.profilePhoto || ''} />
                            <AvatarFallback className="bg-white/20 text-white">
                                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'ME'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">
                                {user?.name || 'Minha Empresa'}
                            </p>
                            <p className="text-xs text-blue-100 truncate">
                                {user?.email || 'Carregando...'}
                            </p>
                        </div>
                    </div>
                </Link>
                <Button
                    variant="outline"
                    className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/auth/login';
                    }}
                >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sair
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 border-r border-blue-800 shadow-xl">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-white/90 backdrop-blur-sm" suppressHydrationWarning>
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

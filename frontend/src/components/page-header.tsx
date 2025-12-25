'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: ReactNode;
    className?: string;
    showBackButton?: boolean;
}

export function PageHeader({ title, description, children, className, showBackButton }: PageHeaderProps) {
    const router = useRouter();

    return (
        <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8", className)}>
            <div className="flex items-center gap-4">
                {showBackButton && (
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Voltar"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-500" />
                    </button>
                )}
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-lg text-muted-foreground mt-2">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
}

export const PAGE_ANIMATION = "animate-in fade-in duration-700";

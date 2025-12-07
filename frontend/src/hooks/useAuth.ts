'use client';

import { buildApiUrl } from '@/lib/apiUrl';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId?: string;
}

export function useAuth(requiredRole?: string) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            if (requiredRole) {
                router.push('/auth/login');
            }
            return;
        }

        try {
            const response = await fetch(buildApiUrl('/auth/profile'), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                localStorage.removeItem('token');
                setLoading(false);
                router.push('/auth/login');
                return;
            }

            const userData = await response.json();
            setUser(userData);

            if (requiredRole && userData.role !== requiredRole) {
                // Special case: if SUPER_ADMIN is required but user is COMPANY_ADMIN
                if (requiredRole === 'SUPER_ADMIN' && userData.role !== 'SUPER_ADMIN') {
                    router.push('/admin/login');
                    return;
                }
                router.push('/unauthorized');
                return;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            router.push('/auth/login');
        } finally {
            setLoading(false);
        }
    };

    return { user, loading };
}

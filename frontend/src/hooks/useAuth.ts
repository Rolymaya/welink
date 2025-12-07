import { buildApiUrl } from '@/lib/apiUrl';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {

            const response = await fetch(buildApiUrl(''), {
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

if (!response.ok) {
    localStorage.removeItem('token');
    setLoading(false);
    // Redirect based on required role
    if (requiredRole === 'SUPER_ADMIN') {
        router.push('/admin/login');
    } else {
        router.push('/auth/login');
    }
    return;
}

const userData = await response.json();
setUser(userData);

// Check role if required
if (requiredRole && userData.role !== requiredRole) {
    router.push('/unauthorized');
    return;
}
        } catch (error) {
    console.error('Auth check failed:', error);
    localStorage.removeItem('token');
    setLoading(false);
    // Redirect based on required role
    if (requiredRole === 'SUPER_ADMIN') {
        router.push('/admin/login');
    } else {
        router.push('/auth/login');
    }
} finally {
    setLoading(false);
}
    };

return { user, loading };
}

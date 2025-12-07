import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Package {
    id: string;
    name: string;
    maxAgents: number;
    maxSessions: number;
    maxContacts: number;
    // Add other fields as needed
}

interface Subscription {
    id: string;
    status: string;
    packageId: string;
    package?: Package;
    // Add other fields as needed
}

interface SubscriptionStatus {
    hasActiveSubscription: boolean;
    subscription: Subscription | null;
}

export function useSubscription() {
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        try {
            const res = await api.get('/subscriptions/status');
            setStatus(res.data);
        } catch (error) {
            console.error('Failed to check subscription:', error);
            // If error, assume no subscription
            setStatus({
                hasActiveSubscription: false,
                subscription: null,
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        hasActiveSubscription: status?.hasActiveSubscription ?? false,
        subscription: status?.subscription ?? null,
        loading,
        refresh: checkSubscription,
    };
}

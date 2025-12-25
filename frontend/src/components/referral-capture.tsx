'use client';

import { useEffect } from 'react';
import { captureReferralFromURL } from '@/lib/referral-cookies';

/**
 * Component to capture referral codes from URL parameters
 * Automatically stores the code in a cookie for 30 days
 */
export default function ReferralCapture() {
    useEffect(() => {
        captureReferralFromURL();
    }, []);

    return null; // This component doesn't render anything
}

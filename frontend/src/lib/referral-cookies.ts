// Utility functions for managing referral cookies

const REFERRAL_COOKIE_NAME = 'welink_referral_code';
const COOKIE_EXPIRY_DAYS = 30;

/**
 * Set referral code in cookie
 * @param referralCode - The referral code to store
 */
export function setReferralCode(referralCode: string): void {
    if (typeof window === 'undefined') return;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);

    document.cookie = `${REFERRAL_COOKIE_NAME}=${referralCode}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Get referral code from cookie
 * @returns The stored referral code or null
 */
export function getReferralCode(): string | null {
    if (typeof window === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === REFERRAL_COOKIE_NAME) {
            return value;
        }
    }
    return null;
}

/**
 * Clear referral code from cookie
 */
export function clearReferralCode(): void {
    if (typeof window === 'undefined') return;

    document.cookie = `${REFERRAL_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Check URL for referral code and store it
 * Should be called on app initialization
 */
export function captureReferralFromURL(): void {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
        setReferralCode(refCode);
        console.log('Referral code captured:', refCode);
    }
}

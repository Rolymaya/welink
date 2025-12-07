import CompanyLayout from '@/components/company-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
    return <CompanyLayout>{children}</CompanyLayout>;
}

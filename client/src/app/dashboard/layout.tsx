import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-screen bg-neutral-950 font-sans text-neutral-100 flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-1 flex flex-row min-h-0">
                <Sidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-900/50">
                    {children}
                </main>
            </div>
        </div>
    );
}

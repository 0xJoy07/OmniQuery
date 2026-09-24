import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto">
                <Sidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900/50">
                    {children}
                </main>
            </div>
        </div>
    );
}

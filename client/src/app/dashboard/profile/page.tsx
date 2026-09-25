import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import Link from 'next/link';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { ShaderBackground } from '@/components/ui/red-in-black';

export default async function ProfilePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    const user = token ? await verifyToken(token) : null;

    return (
        <div className="relative min-h-[calc(100vh-4rem)] w-full bg-background/0">
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <ShaderBackground className="absolute inset-0 opacity-60" />
            </div>
            
            <div className="relative z-10 p-6 sm:p-10 max-w-5xl mx-auto space-y-12 font-mono">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                <h1 className="text-3xl md:text-5xl font-bold text-foreground">PROFILE</h1>
                <Link href="/">
                    <InteractiveHoverButton
                        text="BACK TO HOME"
                        className="w-48 text-sm border-[#FF6B2C] text-[#FF6B2C] bg-transparent"
                    />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SECTION A — User Info Card */}
                <div className="lg:col-span-1">
                    <div className="border border-border rounded-none p-8 flex flex-col items-center text-center h-full bg-background relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6B2C]"></div>
                        <div className="w-24 h-24 rounded-full border-2 border-[#FF6B2C] flex items-center justify-center text-[#FF6B2C] text-4xl font-bold mb-6 mt-4">
                            {(user?.name as string)?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2 uppercase tracking-wide">{(user?.name as string) || 'User'}</h2>
                        <p className="text-foreground/70 text-sm mb-6">{(user?.email as string) || ''}</p>
                        <span className="px-4 py-1.5 border border-[#FF6B2C] text-[#FF6B2C] text-xs font-bold uppercase tracking-widest mb-8">
                            {(user?.role as string) || 'Free Plan'}
                        </span>
                        
                        <div className="mt-auto w-full">
                            <Link href="/" className="w-full">
                                <InteractiveHoverButton
                                    text="EDIT PROFILE"
                                    className="w-full text-sm border-[#FF6B2C] text-[#FF6B2C] bg-transparent"
                                />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {/* SECTION B — Account Settings Panel */}
                    <div className="border border-border rounded-none p-8 h-full bg-background relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6B2C]"></div>
                        <h3 className="text-2xl font-bold text-foreground mb-10 uppercase tracking-wide mt-2">Security</h3>
                        
                        <div className="space-y-12">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-10 border-b border-border gap-6">
                                <div>
                                    <p className="font-bold text-foreground text-lg uppercase tracking-wide mb-2">Password</p>
                                    <p className="text-sm text-foreground/70">Update your account password</p>
                                </div>
                                <Link href="/">
                                    <InteractiveHoverButton
                                        text="CHANGE PWD"
                                        className="w-48 text-sm border-[#FF6B2C] text-[#FF6B2C] bg-transparent"
                                    />
                                </Link>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <p className="font-bold text-foreground text-lg uppercase tracking-wide mb-2">Delete Account</p>
                                    <p className="text-sm text-foreground/70">Permanently delete your data</p>
                                </div>
                                <Link href="/">
                                    <InteractiveHoverButton
                                        text="DELETE ACCT"
                                        className="w-48 text-sm border-[#FF6B2C] text-[#FF6B2C] bg-transparent"
                                    />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}

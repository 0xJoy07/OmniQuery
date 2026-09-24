import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { Settings2, Trash2 } from 'lucide-react';

export default async function ProfilePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    const user = token ? await verifyToken(token) : null;

    return (
        <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white mb-8">Profile Overview</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SECTION A — User Info Card */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-black/20 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-[#FF6B2C]/20 border-2 border-[#FF6B2C]/50 flex items-center justify-center text-[#FF6B2C] text-3xl font-bold mb-4">
                            {(user?.name as string)?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2 className="text-xl font-semibold text-white">{(user?.name as string) || 'Demo User'}</h2>
                        <p className="text-slate-400 text-sm mb-4">{(user?.email as string) || 'user@example.com'}</p>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium uppercase tracking-wider mb-6">
                            {(user?.role as string) || 'Free Plan'}
                        </span>
                        
                        <button className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors">
                            Edit Profile
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    {/* SECTION B — Usage Stats */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Usage Statistics</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                                <p className="text-sm text-slate-400 mb-1">Total Queries</p>
                                <p className="text-2xl font-bold text-white">1,248</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                                <p className="text-sm text-slate-400 mb-1">Tokens Used</p>
                                <p className="text-2xl font-bold text-white">84.2k</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                                <p className="text-sm text-slate-400 mb-1">Saved Responses</p>
                                <p className="text-2xl font-bold text-white">32</p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION C — Recent Activity Feed */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                            <button className="text-[#FF6B2C] hover:text-[#FF6B2C]/80 text-sm font-medium transition-colors">
                                View All
                            </button>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/50">
                            {/* Dummy Data */}
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-slate-200 font-medium">Analyzed Document {i}</span>
                                        <span className="text-xs text-slate-500">{i * 2} hours ago</span>
                                    </div>
                                    <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-xs font-medium">
                                        Success
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION D — Account Settings Panel */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                                <div>
                                    <p className="font-medium text-slate-200">Password</p>
                                    <p className="text-sm text-slate-500">Update your account password</p>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors">
                                    <Settings2 size={16} /> Change
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-red-400">Delete Account</p>
                                    <p className="text-sm text-slate-500">Permanently delete your data</p>
                                </div>
                                <button disabled className="flex items-center gap-2 px-4 py-2 border border-red-900/50 text-red-500 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

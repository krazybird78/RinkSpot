'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LayoutDashboard, ArrowLeft, Trash2, Check, X, ShieldAlert, Snowflake, Wrench, MapPin, FileText, AlertTriangle, Activity } from 'lucide-react';

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ rinks: 0, reports: 0, pendingDeletions: 0 });
    const [deletionRequests, setDeletionRequests] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'dashboard' | 'reports' | 'rinks' | 'analytics'>('dashboard');
    const [reports, setReports] = useState<any[]>([]);
    const [rinks, setRinks] = useState<any[]>([]);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingRink, setEditingRink] = useState<any | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (activeView === 'reports') {
            fetchReports();
        } else if (activeView === 'rinks') {
            fetchRinks();
        } else if (activeView === 'analytics') {
            fetchAnalytics();
        }
    }, [activeView]);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/auth');
            return;
        }
        setCurrentUser(user.id);
        fetchData();
    };

    const fetchReports = async () => {
        const { data, error } = await supabase
            .from('reports')
            .select('*, rinks(name, city), users(display_name)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching reports:', error);
        } else {
            setReports(data || []);
        }
    };

    const fetchRinks = async () => {
        let query = supabase.from('rinks').select('*').order('name');

        if (searchQuery) {
            query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data, error } = await query.limit(50);

        if (error) {
            console.error('Error fetching rinks:', error);
        } else {
            setRinks(data || []);
        }
    };

    const fetchAnalytics = async () => {
        // Fetch last 500 reports for analysis
        const { data, error } = await supabase
            .from('reports')
            .select('ice_status, crowd_level, rinks(name)')
            .order('created_at', { ascending: false })
            .limit(500);

        if (error) {
            console.error('Error fetching analytics:', error);
            return;
        }

        const reports = data || [];

        // 1. Ice Status Distribution
        const iceStatusCounts: Record<string, number> = {};
        reports.forEach(r => {
            const status = r.ice_status || 'unknown';
            iceStatusCounts[status] = (iceStatusCounts[status] || 0) + 1;
        });

        // 2. Crowd Level Distribution
        const crowdLevelCounts: Record<string, number> = {};
        reports.forEach(r => {
            const crowd = r.crowd_level || 'unknown';
            crowdLevelCounts[crowd] = (crowdLevelCounts[crowd] || 0) + 1;
        });

        // 3. Top Active Rinks
        const rinkCounts: Record<string, number> = {};
        reports.forEach(r => {
            const rinkData = Array.isArray(r.rinks) ? r.rinks[0] : r.rinks;
            const name = rinkData?.name || 'Unknown Rink';
            rinkCounts[name] = (rinkCounts[name] || 0) + 1;
        });

        const topRinks = Object.entries(rinkCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        setAnalyticsData({
            iceStatusCounts,
            crowdLevelCounts,
            topRinks,
            totalAnalyzed: reports.length
        });
    };

    // Debounce search
    useEffect(() => {
        if (activeView === 'rinks') {
            const timer = setTimeout(() => {
                fetchRinks();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchQuery]);

    const handleSaveRink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRink) return;

        const { error } = await supabase
            .from('rinks')
            .update({
                name: editingRink.name,
                city: editingRink.city,
                address: editingRink.address,
                country: editingRink.country
            })
            .eq('id', editingRink.id);

        if (error) {
            alert('Error updating rink: ' + error.message);
        } else {
            alert('Rink updated successfully!');
            setEditingRink(null);
            fetchRinks();
        }
    };

    const handleDeleteRink = async (rinkId: string) => {
        if (!confirm('Are you SUPER SURE? This will delete the rink and ALL associated reports. This cannot be undone.')) return;

        const { error } = await supabase
            .from('rinks')
            .delete()
            .eq('id', rinkId);

        if (error) {
            alert('Error deleting rink: ' + error.message);
        } else {
            alert('Rink deleted.');
            fetchRinks();
            fetchData();
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!confirm('Are you sure you want to delete this report?')) return;

        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', reportId);

        if (error) {
            alert('Error deleting report: ' + error.message);
        } else {
            fetchReports();
            fetchData(); // Refresh stats
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch rinks to count valid ones (filtering out ghosts)
            const { data: allRinks } = await supabase.from('rinks').select('id, latitude, longitude');

            const invalidIds = [
                '362cd349-cc7c-456e-93e1-9913660bf847', // Nuns Island (0,0)
                '2ef96e5d-99f5-46a7-9af5-a66b76c13347'  // Duplicate Parc de la Fontaine
            ];

            const validRinks = (allRinks || []).filter(r =>
                !(Math.abs(r.latitude) < 0.0001 && Math.abs(r.longitude) < 0.0001) &&
                !invalidIds.includes(r.id)
            );

            const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });

            // Fetch pending deletion requests with rink info
            const { data: deletions, error } = await supabase
                .from('deletion_requests')
                .select('*, rinks(name, city, country)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setStats({
                rinks: validRinks.length,
                reports: reportCount || 0,
                pendingDeletions: deletions?.length || 0
            });

            setDeletionRequests(deletions || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDeletion = async (requestId: string, rinkName: string) => {
        if (!confirm(`Are you sure you want to CONFIRM the deletion of "${rinkName}"? This will start the 7-day timer.`)) {
            return;
        }

        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 7);

        const { error } = await supabase
            .from('deletion_requests')
            .update({
                status: 'confirmed',
                confirmed_by: currentUser,
                scheduled_deletion_at: scheduledDate.toISOString(),
            })
            .eq('id', requestId);

        if (error) {
            alert('Error confirming deletion: ' + error.message);
        } else {
            alert('Deletion confirmed!');
            fetchData();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-rink-blue flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-ice-white/20 border-t-vegas-gold rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rink-blue text-ice-white font-sans selection:bg-vegas-gold/30 relative overflow-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-linear-to-br from-rink-blue via-puck-black/50 to-rink-blue" />
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-ice-white/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-vegas-gold/5 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-puck-black/80 backdrop-blur-md border-b border-ice-white/10 p-4 shadow-lg">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-ice-white/5 rounded-xl flex items-center justify-center border border-ice-white/10 shadow-inner">
                            <ShieldAlert className="w-6 h-6 text-vegas-gold" />
                        </div>
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase text-ice-white">
                            ADMIN <span className="text-vegas-gold">DASHBOARD</span>
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        {activeView !== 'dashboard' && (
                            <button
                                onClick={() => setActiveView('dashboard')}
                                className="px-4 py-2 bg-ice-white/5 hover:bg-ice-white/10 text-ice-white rounded-full transition-all border border-ice-white/10 text-xs font-bold uppercase tracking-wider"
                            >
                                Dashboard
                            </button>
                        )}
                        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-ice-white/5 hover:bg-ice-white/10 text-ice-white/60 hover:text-ice-white rounded-full transition-all border border-ice-white/10 text-xs font-bold uppercase tracking-wider group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Map
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 space-y-8 relative z-10 pt-8">

                {activeView === 'dashboard' ? (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Metric Card 1 */}
                            <div className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-ice-white/20 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Snowflake className="w-24 h-24" />
                                </div>
                                <h3 className="text-xs font-bold text-ice-white/60 uppercase tracking-widest mb-1">Total Rinks</h3>
                                <p className="text-4xl font-black italic text-vegas-gold">{stats.rinks}</p>
                            </div>

                            {/* Metric Card 2 */}
                            <div className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-ice-white/20 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FileText className="w-24 h-24" />
                                </div>
                                <h3 className="text-xs font-bold text-ice-white/60 uppercase tracking-widest mb-1">Total Reports</h3>
                                <p className="text-4xl font-black italic text-status-good">{stats.reports}</p>
                            </div>

                            {/* Metric Card 3 */}
                            <div className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-ice-white/20 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Trash2 className="w-24 h-24" />
                                </div>
                                <h3 className="text-xs font-bold text-ice-white/60 uppercase tracking-widest mb-1">Pending Deletions</h3>
                                <p className="text-4xl font-black italic text-rose-500">{stats.pendingDeletions}</p>
                            </div>
                        </div>

                        {/* Deletion Requests */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                                </div>
                                <h2 className="text-lg font-black italic uppercase text-ice-white tracking-wide">
                                    Pending Deletion Requests
                                </h2>
                            </div>

                            {deletionRequests.length === 0 ? (
                                <div className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-2xl p-12 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-ice-white/5 rounded-full flex items-center justify-center mb-4">
                                        <Check className="w-8 h-8 text-status-good" />
                                    </div>
                                    <h3 className="text-ice-white font-bold text-lg mb-2">All Clear!</h3>
                                    <p className="text-ice-white/50 text-sm max-w-sm">
                                        No pending deletion requests found. All rinks are accounted for.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {deletionRequests.map((req) => (
                                        <div key={req.id} className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-rose-500/30 transition-colors group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0 border border-rose-500/20 group-hover:bg-rose-500/20 transition-colors">
                                                    <MapPin className="w-6 h-6 text-rose-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-ice-white mb-1">
                                                        {(Array.isArray(req.rinks) ? req.rinks[0] : req.rinks)?.name || 'Unknown Rink'}
                                                    </h3>
                                                    <p className="text-sm text-ice-white/60 flex items-center gap-1.5 mb-2">
                                                        <span className="w-1 h-1 bg-vegas-gold rounded-full" />
                                                        {(Array.isArray(req.rinks) ? req.rinks[0] : req.rinks)?.city}, {(Array.isArray(req.rinks) ? req.rinks[0] : req.rinks)?.country}
                                                    </p>
                                                    <div className="flex gap-4 text-xs font-mono text-ice-white/40">
                                                        <span>ID: <span className="text-ice-white/60">{req.id.substring(0, 8)}</span></span>
                                                        <span>Requested: <span className="text-ice-white/60">{new Date(req.created_at).toLocaleDateString()}</span></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex w-full md:w-auto">
                                                <button
                                                    onClick={() => handleConfirmDeletion(req.id, (Array.isArray(req.rinks) ? req.rinks[0] : req.rinks)?.name)}
                                                    className="w-full md:w-auto px-6 py-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Confirm Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Additional Tools */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-vegas-gold/10 flex items-center justify-center border border-vegas-gold/20">
                                    <Wrench className="w-4 h-4 text-vegas-gold" />
                                </div>
                                <h2 className="text-lg font-black italic uppercase text-ice-white tracking-wide">
                                    Maintenance Tools
                                </h2>
                            </div>

                            <div className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-2xl p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setActiveView('reports')}
                                        className="p-4 border border-ice-white/10 rounded-xl bg-ice-white/5 flex items-center gap-3 hover:bg-ice-white/10 transition-colors group text-left"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-ice-white/10 flex items-center justify-center group-hover:bg-vegas-gold/20 transition-colors">
                                            <FileText className="w-4 h-4 text-ice-white/60 group-hover:text-vegas-gold" />
                                        </div>
                                        <span className="text-sm font-bold text-ice-white group-hover:text-white">Manage Reports</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveView('rinks')}
                                        className="p-4 border border-ice-white/10 rounded-xl bg-ice-white/5 flex items-center gap-3 hover:bg-ice-white/10 transition-colors group text-left"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-ice-white/10 flex items-center justify-center group-hover:bg-vegas-gold/20 transition-colors">
                                            <MapPin className="w-4 h-4 text-ice-white/60 group-hover:text-vegas-gold" />
                                        </div>
                                        <span className="text-sm font-bold text-ice-white group-hover:text-white">Edit Rink Details</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveView('analytics')}
                                        className="p-4 border border-ice-white/10 rounded-xl bg-ice-white/5 flex items-center gap-3 hover:bg-ice-white/10 transition-colors group text-left"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-ice-white/10 flex items-center justify-center group-hover:bg-vegas-gold/20 transition-colors">
                                            <Activity className="w-4 h-4 text-ice-white/60 group-hover:text-vegas-gold" />
                                        </div>
                                        <span className="text-sm font-bold text-ice-white group-hover:text-white">View Analytics</span>
                                    </button>
                                </div>
                            </div>
                        </section>
                    </>
                ) : activeView === 'reports' ? (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-vegas-gold/10 flex items-center justify-center border border-vegas-gold/20">
                                <FileText className="w-4 h-4 text-vegas-gold" />
                            </div>
                            <h2 className="text-lg font-black italic uppercase text-ice-white tracking-wide">
                                Manage Reports (Last 50)
                                {/* Recent reports list */}
                            </h2>
                        </div>

                        <div className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-ice-white/80 min-w-[600px]">
                                    <thead className="bg-ice-white/5 text-ice-white font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Rink</th>
                                            <th className="p-4">User</th>
                                            <th className="p-4">Condition</th>
                                            <th className="p-4">Crowd</th>
                                            <th className="p-4">Time</th>
                                            <th className="p-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ice-white/5">
                                        {reports.map((report) => (
                                            <tr key={report.id} className="hover:bg-ice-white/5 transition-colors">
                                                <td className="p-4 font-medium text-white">{(Array.isArray(report.rinks) ? report.rinks[0] : report.rinks)?.name || 'Unknown'}</td>
                                                <td className="p-4">{report.users?.display_name || 'Anonymous'}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase bg-status-${report.ice_status}/10 text-status-${report.ice_status}`}>
                                                        {report.ice_status}
                                                    </span>
                                                </td>
                                                <td className="p-4 capitalize">{report.crowd_level}</td>
                                                <td className="p-4 text-ice-white/50">{new Date(report.created_at).toLocaleString()}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteReport(report.id)}
                                                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors"
                                                        title="Delete Report"
                                                        aria-label="Delete Report"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {reports.length === 0 && (
                                <div className="p-8 text-center text-ice-white/50 italic">No reports found.</div>
                            )}
                        </div>
                    </section>
                ) : activeView === 'rinks' ? (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-vegas-gold/10 flex items-center justify-center border border-vegas-gold/20">
                                    <MapPin className="w-4 h-4 text-vegas-gold" />
                                </div>
                                <h2 className="text-lg font-black italic uppercase text-ice-white tracking-wide">
                                    Edit Rink Details
                                </h2>
                            </div>
                            <input
                                type="text"
                                placeholder="Search rinks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search rinks"
                                className="bg-puck-black/60 border border-ice-white/10 rounded-full px-4 py-2 text-xs text-ice-white focus:outline-none focus:border-vegas-gold/50 w-64"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {rinks.map((rink) => (
                                <div key={rink.id} className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-xl p-4 flex justify-between items-center group hover:border-ice-white/20 transition-all">
                                    <div>
                                        <h3 className="text-sm font-bold text-ice-white">{rink.name}</h3>
                                        <p className="text-xs text-ice-white/60">{rink.address}, {rink.city}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingRink(rink)}
                                            className="p-2 bg-ice-white/5 hover:bg-ice-white/10 text-vegas-gold rounded-lg transition-colors"
                                            title="Edit Rink"
                                            aria-label="Edit Rink"
                                        >
                                            <Wrench className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRink(rink.id)}
                                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors"
                                            title="Delete Rink"
                                            aria-label="Delete Rink"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Edit Modal Overlay */}
                        {editingRink && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-100 p-4">
                                <form onSubmit={handleSaveRink} className="bg-[#111] border border-ice-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                                    <h3 className="text-lg font-black italic text-ice-white mb-4">EDIT RINK</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-ice-white/60 uppercase block mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={editingRink.name}
                                                onChange={(e) => setEditingRink({ ...editingRink, name: e.target.value })}
                                                className="w-full bg-ice-white/5 border border-ice-white/10 rounded-lg px-3 py-2 text-sm text-ice-white focus:outline-none focus:border-vegas-gold"
                                                title="Rink Name"
                                                placeholder="Rink Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-ice-white/60 uppercase block mb-1">City</label>
                                            <input
                                                type="text"
                                                value={editingRink.city}
                                                onChange={(e) => setEditingRink({ ...editingRink, city: e.target.value })}
                                                className="w-full bg-ice-white/5 border border-ice-white/10 rounded-lg px-3 py-2 text-sm text-ice-white focus:outline-none focus:border-vegas-gold"
                                                title="City"
                                                placeholder="City"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-ice-white/60 uppercase block mb-1">Address</label>
                                            <input
                                                type="text"
                                                value={editingRink.address || ''}
                                                onChange={(e) => setEditingRink({ ...editingRink, address: e.target.value })}
                                                className="w-full bg-ice-white/5 border border-ice-white/10 rounded-lg px-3 py-2 text-sm text-ice-white focus:outline-none focus:border-vegas-gold"
                                                title="Address"
                                                placeholder="Address"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setEditingRink(null)}
                                            className="flex-1 py-3 text-xs font-bold text-ice-white/60 hover:text-ice-white hover:bg-ice-white/5 rounded-xl transition-colors"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-vegas-gold hover:bg-vegas-gold/90 text-puck-black text-xs font-black uppercase rounded-xl transition-colors"
                                        >
                                            SAVE CHANGES
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </section>
                ) : activeView === 'analytics' ? (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-vegas-gold/10 flex items-center justify-center border border-vegas-gold/20">
                                    <Activity className="w-4 h-4 text-vegas-gold" />
                                </div>
                                <h2 className="text-lg font-black italic uppercase text-ice-white tracking-wide">
                                    Analytics Overview
                                </h2>
                            </div>
                            <span className="text-xs text-ice-white/40 font-mono">Based on last {analyticsData?.totalAnalyzed || 0} reports</span>
                        </div>

                        {analyticsData && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Ice Status Chart */}
                                <div className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold text-ice-white mb-4 uppercase tracking-wider">Ice Condition</h3>
                                    <div className="space-y-4">
                                        {Object.entries(analyticsData.iceStatusCounts as Record<string, number>)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([status, count]) => (
                                                <div key={status}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="capitalize text-ice-white/80">{status}</span>
                                                        <span className="text-ice-white/40">{count}</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-ice-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-status-${status}`}
                                                            style={{ width: `${(count / analyticsData.totalAnalyzed) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Top Rinks */}
                                <div className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold text-ice-white mb-4 uppercase tracking-wider">Most Active Rinks</h3>
                                    <div className="space-y-3">
                                        {(analyticsData.topRinks as any[]).map((rink, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-ice-white/5 rounded-xl border border-ice-white/5">
                                                <span className="text-xs font-bold text-ice-white truncate max-w-[200px]">{rink.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-vegas-gold">{rink.count}</span>
                                                    <span className="text-[10px] text-ice-white/40">reports</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Crowd Distribution */}
                                <div className="bg-puck-black/40 backdrop-blur-xl border border-ice-white/10 rounded-2xl p-6 md:col-span-2">
                                    <h3 className="text-sm font-bold text-ice-white mb-4 uppercase tracking-wider">Crowd Levels</h3>
                                    <div className="flex gap-4">
                                        {Object.entries(analyticsData.crowdLevelCounts as Record<string, number>).map(([crowd, count]) => (
                                            <div key={crowd} className="flex-1 text-center p-4 bg-ice-white/5 rounded-xl border border-ice-white/5">
                                                <div className="text-2xl font-black italic text-ice-white mb-1">{count}</div>
                                                <div className="text-[10px] uppercase tracking-wider text-ice-white/40">{crowd}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                ) : null}

            </main>
        </div >
    );
}

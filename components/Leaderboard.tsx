'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
// import { getBadgeInfo } from '@/lib/scoring';
import { playSound } from '@/lib/sounds';
import Image from 'next/image';
import { Medal, X, Trophy, Crown } from 'lucide-react';

// Avatar mapping (copied from LockerRoom)
import { AVATAR_MAP } from '@/lib/avatars';
import PlayerCard from '@/components/PlayerCard';

interface LeaderboardEntry {
    user_id: string;
    total_points: number;
    rinks_added: number;
    reports_submitted: number;
    rank: number;
    display_name?: string;
    team?: string;
    avatar_id?: string;
}

interface LeaderboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
    const [viewMode, setViewMode] = useState<'users' | 'rinks'>('rinks'); // Default to rinks as requested
    const [userLeaders, setUserLeaders] = useState<LeaderboardEntry[]>([]);
    const [rinkLeaders, setRinkLeaders] = useState<any[]>([]); // Using any for now to speed up dev
    const [loading, setLoading] = useState(false);
    const [timeframe, setTimeframe] = useState<'all' | 'week'>('all');
    const [previewAvatarId, setPreviewAvatarId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (viewMode === 'users') {
                loadUserLeaderboard();
            } else {
                loadRinkLeaderboard();
            }
        }
    }, [isOpen, timeframe, viewMode]);

    const loadUserLeaderboard = async () => {
        setLoading(true);
        try {
            // Get top 10 users by points
            const { data: statsData, error: statsError } = await supabase
                .from('user_stats')
                .select('*')
                .order('total_points', { ascending: false })
                .limit(10);

            if (statsError) throw statsError;

            // Get user profiles for display names
            const userIds = statsData?.map(s => s.user_id) || [];
            const { data: usersData } = await supabase
                .from('users')
                .select('id, display_name, team:neighborhood_team, avatar_id')
                .in('id', userIds);

            // Merge stats with user info
            const merged = statsData?.map((stat, index) => {
                const user = usersData?.find(u => u.id === stat.user_id);
                return {
                    ...stat,
                    rank: index + 1,
                    display_name: user?.display_name || 'Anonymous',
                    team: user?.team,
                    avatar_id: user?.avatar_id,
                };
            }) || [];

            setUserLeaders(merged);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRinkLeaderboard = async () => {
        setLoading(true);
        try {
            // Fetch all rinks
            // Note: Ideally this should be a database view or RPC for scalability
            const { data: rinks, error: rinksError } = await supabase
                .from('rinks')
                .select('id, name, city, country, rink_type');

            if (rinksError) throw rinksError;

            // Fetch reports with ratings
            // Optimization: We could limit this timeframe if needed, but for "Best Rinks" we usually want all time
            const { data: reports, error: reportsError } = await supabase
                .from('reports')
                .select('rink_id, rating')
                .not('rating', 'is', null);

            if (reportsError) throw reportsError;

            // Calculate averages
            const rinkStats: Record<string, { total: number; count: number }> = {};
            reports?.forEach(r => {
                if (!rinkStats[r.rink_id]) {
                    rinkStats[r.rink_id] = { total: 0, count: 0 };
                }
                rinkStats[r.rink_id].total += r.rating;
                rinkStats[r.rink_id].count += 1;
            });

            // Map results to rinks and sort
            const rankedRinks = rinks.map(rink => {
                const stats = rinkStats[rink.id] || { total: 0, count: 0 };
                return {
                    ...rink,
                    averageRating: stats.count > 0 ? stats.total / stats.count : 0,
                    reviewCount: stats.count,
                };
            })
                .filter(r => r.reviewCount > 0) // Only show rinks with reviews
                .sort((a, b) => {
                    // Sort by average rating first
                    if (b.averageRating !== a.averageRating) {
                        return b.averageRating - a.averageRating;
                    }
                    // Tiebreaker: Number of reviews
                    return b.reviewCount - a.reviewCount;
                })
                .slice(0, 10); // Top 10

            setRinkLeaders(rankedRinks);

        } catch (error) {
            console.error('Error loading rink leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-puck-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-24 font-sans overflow-y-auto">
            <div className="max-w-2xl w-full rounded-3xl shadow-2xl border border-ice-white/10 bg-puck-black/90 backdrop-blur-xl text-ice-white p-6 md:p-8 relative mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-vegas-gold" />
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-ice-white">
                            LEADER<span className="text-vegas-gold">BOARD</span>
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-ice-white hover:text-vegas-gold transition-colors"
                        title="Close Leaderboard"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Tab Toggle: Users vs Rinks */}
                <div className={`bg-ice-white/5 p-1 rounded-xl flex gap-1 border border-ice-white/10 transition-all ${viewMode === 'users' ? 'mb-2' : 'mb-6'}`}>
                    <button
                        onClick={() => setViewMode('rinks')}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${viewMode === 'rinks'
                            ? 'bg-white/25 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm'
                            : 'border-transparent text-ice-white/40 hover:bg-ice-white/5'
                            }`}
                    >
                        TOP RINKS
                    </button>
                    <button
                        onClick={() => setViewMode('users')}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${viewMode === 'users'
                            ? 'bg-white/25 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm'
                            : 'border-transparent text-ice-white/40 hover:bg-ice-white/5'
                            }`}
                    >
                        TOP PLAYERS
                    </button>
                </div>

                {/* Sub-Timeframe Toggle (Only for Users for now) */}
                {viewMode === 'users' && (
                    <div className="bg-ice-white/5 p-1 rounded-xl flex gap-1 mb-6 border border-ice-white/10 animate-in fade-in slide-in-from-top-2">
                        <button
                            onClick={() => setTimeframe('all')}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${timeframe === 'all'
                                ? 'bg-white/25 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm'
                                : 'border-transparent text-ice-white/40 hover:bg-ice-white/5'
                                }`}
                        >
                            ALL TIME
                        </button>
                        <button
                            onClick={() => setTimeframe('week')}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${timeframe === 'week'
                                ? 'bg-white/25 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm'
                                : 'border-transparent text-ice-white/40 hover:bg-ice-white/5'
                                }`}
                        >
                            THIS WEEK
                        </button>
                    </div>
                )}

                {/* Leaderboard Table */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-ice-white/60">
                        <div className="w-8 h-8 rounded-full border-4 border-vegas-gold border-t-transparent animate-spin" />
                        <p className="text-xs font-black tracking-widest uppercase">LOADING STATS...</p>
                    </div>
                ) : (
                    <>
                        {/* RINKS VIEW */}
                        {viewMode === 'rinks' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
                                {rinkLeaders.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-ice-white/10 rounded-2xl bg-ice-white/5">
                                        <Trophy className="w-12 h-12 text-ice-white/20 mx-auto mb-3" />
                                        <p className="text-ice-white/60 text-xs font-bold uppercase tracking-wide">No rated rinks yet</p>
                                        <p className="text-ice-white/40 text-[10px] mt-1">Be the first to rate a rink!</p>
                                    </div>
                                ) : (
                                    rinkLeaders.map((rink, index) => (
                                        <div
                                            key={rink.id}
                                            className={`p-4 rounded-xl border transition-all ${index === 0
                                                ? 'border-vegas-gold/50 bg-linear-to-r from-vegas-gold/20 to-vegas-gold/5'
                                                : 'border-ice-white/10 bg-ice-white/5 hover:bg-ice-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                        {index === 0 ? <Crown className="w-8 h-8 text-yellow-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" strokeWidth={2.5} /> :
                                                            index === 1 ? <Medal className="w-7 h-7 text-gray-300 drop-shadow-sm" strokeWidth={2} /> :
                                                                index === 2 ? <Medal className="w-6 h-6 text-orange-400 drop-shadow-sm" strokeWidth={2} /> :
                                                                    <span className="text-lg font-black text-ice-white/40">#{index + 1}</span>}
                                                    </div>

                                                    <div>
                                                        <p className={`font-black uppercase tracking-tight text-sm ${index === 0 ? 'text-vegas-gold text-lg' : 'text-ice-white'}`}>
                                                            {rink.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] text-ice-white/60 font-bold mt-0.5">
                                                            <span className="uppercase">{rink.rink_type}</span>
                                                            <span>•</span>
                                                            <span>{rink.city}, {rink.country}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <div className="bg-puck-black/50 border border-vegas-gold/30 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                                        <p className="text-vegas-gold font-black text-lg leading-none">
                                                            {rink.averageRating.toFixed(1)}
                                                        </p>
                                                        <p className="text-[8px] text-ice-white/50 font-medium text-center mt-0.5 uppercase tracking-wide">
                                                            {rink.reviewCount} {rink.reviewCount === 1 ? 'Vote' : 'Votes'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* USERS VIEW */}
                        {viewMode === 'users' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
                                {userLeaders.length === 0 ? (
                                    <p className="text-center text-ice-white/60 text-xs font-medium py-10">No data yet. Be the first!</p>
                                ) : (
                                    userLeaders.map((leader, index) => (
                                        <div
                                            key={leader.user_id}
                                            className={`p-4 rounded-xl border transition-all ${index === 0
                                                ? 'border-vegas-gold/30 bg-vegas-gold/10'
                                                : index <= 2 ? 'border-ice-white/20 bg-ice-white/5' : 'border-transparent bg-ice-white/5 hover:bg-ice-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-2xl w-8 text-center shrink-0 flex justify-center">
                                                        {index === 0 ? <Crown className="w-6 h-6 text-yellow-400" strokeWidth={2.5} /> :
                                                            index === 1 ? <Medal className="w-6 h-6 text-gray-300" strokeWidth={2} /> :
                                                                index === 2 ? <Medal className="w-6 h-6 text-orange-400" strokeWidth={2} /> :
                                                                    `#${leader.rank}`}
                                                    </div>

                                                    {/* Avatar or Color Dot */}
                                                    <button
                                                        onClick={() => leader.avatar_id && AVATAR_MAP[leader.avatar_id] && setPreviewAvatarId(leader.avatar_id)}
                                                        className="flex items-center justify-center shrink-0 transition-transform hover:scale-110 active:scale-95 disabled:hover:scale-100 disabled:cursor-default"
                                                        disabled={!leader.avatar_id || !AVATAR_MAP[leader.avatar_id]}
                                                        title={leader.avatar_id ? "Tap to zoom" : ""}
                                                    >
                                                        {leader.avatar_id && AVATAR_MAP[leader.avatar_id] ? (
                                                            <div className="scale-75 origin-left">
                                                                <PlayerCard avatarId={leader.avatar_id} size="sm" />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={`w-8 h-8 rounded-full border-2 border-ice-white bg-[var(--${leader.avatar_id || 'vegas-gold'})]`}
                                                            />
                                                        )}
                                                    </button>

                                                    <div className="min-w-0">
                                                        <p className="text-ice-white font-bold text-sm font-sans truncate max-w-[140px]">
                                                            {leader.display_name}
                                                        </p>
                                                        {leader.team && (
                                                            <p className="text-ice-white/60 text-xs font-medium">{leader.team}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-vegas-gold font-bold text-xl font-sans">
                                                        {leader.total_points}
                                                    </p>
                                                    <p className="text-ice-white/60 text-[10px] font-medium">
                                                        {leader.rinks_added} rinks • {leader.reports_submitted} reports
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-ice-white/10 hover:bg-ice-white/20 text-ice-white py-4 font-bold rounded-xl border border-ice-white/10 hover:border-ice-white/30 transition-all text-xs tracking-widest uppercase"
                >
                    CLOSE
                </button>
            </div>

            {/* Avatar Zoom Modal */}
            {previewAvatarId && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-200"
                    onClick={() => setPreviewAvatarId(null)}
                >
                    <div className="relative animate-in zoom-in-95 duration-300">
                        <PlayerCard avatarId={previewAvatarId} size="xl" className="shadow-[0_0_100px_rgba(180,151,90,0.3)]" />
                        <button
                            className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-ice-white/50 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Tap to close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

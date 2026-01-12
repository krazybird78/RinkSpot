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
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [timeframe, setTimeframe] = useState<'all' | 'week'>('all');
    const [previewAvatarId, setPreviewAvatarId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadLeaderboard();
        }
    }, [isOpen, timeframe]);

    const loadLeaderboard = async () => {
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

            setLeaders(merged);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-puck-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-ice-white/10 bg-puck-black/90 backdrop-blur-xl text-ice-white p-6 md:p-8">
                <div className="flex justify-between items-center mb-8">
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

                {/* Timeframe Toggle */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setTimeframe('all')}
                        className={`flex-1 px-6 py-3 text-xs font-bold rounded-xl transition-all border ${timeframe === 'all'
                            ? 'border-vegas-gold bg-vegas-gold/20 text-vegas-gold shadow-lg shadow-vegas-gold/10'
                            : 'border-ice-white/10 bg-ice-white/5 text-ice-white/60 hover:text-ice-white hover:bg-ice-white/10'
                            }`}
                    >
                        ALL TIME
                    </button>
                    <button
                        onClick={() => setTimeframe('week')}
                        className={`flex-1 px-6 py-3 text-xs font-bold rounded-xl transition-all border ${timeframe === 'week'
                            ? 'border-vegas-gold bg-vegas-gold/20 text-vegas-gold shadow-lg shadow-vegas-gold/10'
                            : 'border-ice-white/10 bg-ice-white/5 text-ice-white/60 hover:text-ice-white hover:bg-ice-white/10'
                            }`}
                    >
                        THIS WEEK
                    </button>
                </div>

                {/* Leaderboard Table */}
                {loading ? (
                    <p className="text-center text-ice-white/60 text-xs font-medium">Loading...</p>
                ) : leaders.length === 0 ? (
                    <p className="text-center text-ice-white/60 text-xs font-medium">No data yet. Be the first!</p>
                ) : (
                    <div className="space-y-2">
                        {leaders.map((leader, index) => (
                            <div
                                key={leader.user_id}
                                className={`p-4 rounded-xl border transition-all ${index === 0
                                    ? 'border-vegas-gold/30 bg-vegas-gold/10'
                                    : index === 1
                                        ? 'border-ice-white/20 bg-ice-white/5'
                                        : index === 2
                                            ? 'border-ice-white/10 bg-ice-white/5'
                                            : 'border-transparent bg-ice-white/5 hover:bg-ice-white/10'
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
                        ))}
                    </div>
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

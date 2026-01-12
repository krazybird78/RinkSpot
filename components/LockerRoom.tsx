'use client';

import { useState, useEffect } from 'react';
import { supabase, User } from '@/lib/supabase';
import { playSound } from '@/lib/sounds';
import { getBadgeInfo, BadgeType } from '@/lib/scoring';
import Image from 'next/image';

interface LockerRoomProps {
    isOpen: boolean;
    onClose: () => void;
}

const NEIGHBORHOOD_TEAMS = [
    'Verdun', 'Plateau', 'Mile End', 'Rosemont',
    'Brooklyn', 'Queens', 'Manhattan',
    'Stockholm', 'Helsinki', 'Oslo',
    'Custom'
];

import { AVATAR_MAP } from '@/lib/avatars';
import PlayerCard from '@/components/PlayerCard';
import { cn } from '@/lib/utils';
import { Trophy, MapPin, FileText, Flame, Save, LogOut, Check, ShoppingBag, X, Landmark, Gamepad2, Swords, Sun, Moon, Calendar, Globe, ThermometerSnowflake, Users } from 'lucide-react';


// Define availble colors/teams
const TEAM_COLORS = {
    free: [
        { name: 'Las Vegas', primary: 'vegas-gold', secondary: 'puck-black', avatar: 'vegas-gold' },
        { name: 'Florida', primary: 'florida-teal', secondary: 'montreal-red', avatar: 'florida-teal' },
        { name: 'Arizona', primary: 'arizona-grey', secondary: 'puck-black', avatar: 'arizona-grey' },
    ],
    heritage: [
        { name: 'Montreal', primary: 'montreal-red', secondary: 'montreal-blue', avatar: 'montreal-red' },
        { name: 'Toronto', primary: 'toronto-blue', secondary: 'toronto-white', avatar: 'toronto-blue' },
        { name: 'Boston', primary: 'boston-gold', secondary: 'boston-black', avatar: 'boston-gold' },
    ],
    nostalgia: [
        { name: 'Quebec', primary: 'quebec-blue', secondary: 'quebec-red', avatar: 'quebec-blue' },
        { name: 'Hartford', primary: 'hartford-green', secondary: 'hartford-blue', avatar: 'hartford-green' },
        { name: 'Minnesota', primary: 'minnesota-green', secondary: 'minnesota-gold', avatar: 'minnesota-green' },
    ],
    enforcer: [
        { name: 'Enforcer 1', primary: 'puck-black', secondary: 'ice-white', avatar: 'enforcer-1' },
        { name: 'Enforcer 2', primary: 'philly-orange', secondary: 'montreal-red', avatar: 'enforcer-2' },
    ]
};

export default function LockerRoom({ isOpen, onClose }: LockerRoomProps) {
    const [user, setUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [neighborhoodTeam, setNeighborhoodTeam] = useState('');
    const [customTeam, setCustomTeam] = useState('');
    const [selectedColor, setSelectedColor] = useState('vegas-gold');
    const [loading, setLoading] = useState(false);
    const [showProShop, setShowProShop] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [badges, setBadges] = useState<any[]>([]);

    const [notification, setNotification] = useState<string | null>(null);
    const [previewAvatarId, setPreviewAvatarId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadUserProfile();
        }
    }, [isOpen]);

    const loadUserProfile = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profile) {
                setUser(profile);
                setDisplayName(profile.display_name || '');
                setNeighborhoodTeam(profile.neighborhood_team || '');
                if (profile.avatar_id) {
                    setSelectedColor(profile.avatar_id);
                }
            }

            // Fetch Gamification Stats
            const { data: statsData } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', authUser.id)
                .single();
            setStats(statsData);

            // Fetch Badges
            const { data: badgesData } = await supabase
                .from('user_badges')
                .select('*')
                .eq('user_id', authUser.id);
            setBadges(badgesData || []);

        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const teamName = neighborhoodTeam === 'Custom' ? customTeam : neighborhoodTeam;

            const { error } = await supabase
                .from('users')
                .update({
                    display_name: displayName,
                    neighborhood_team: teamName,
                    avatar_id: selectedColor,
                })
                .eq('id', user.id);

            if (error) throw error;

            playSound('goal-horn');
            setNotification('PROFILE SAVED SUCCESSFULLY');
            setTimeout(() => {
                onClose();
                setNotification(null);
            }, 1500);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        playSound('menu-beep');
        window.location.href = '/';
    };

    const handlePurchase = async (product: string) => {
        if (!user) return;

        try {
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, product }),
            });

            if (!response.ok) {
                const text = await response.text();
                // Try to parse JSON error, fall back to text
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.error || `Server error: ${response.status}`);
                } catch {
                    throw new Error(`Server Error (${response.status}): ${text.slice(0, 100)}`);
                }
            }

            const { url } = await response.json();

            if (url) {
                window.location.href = url;
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            alert(`Checkout Failed: ${error.message}`);
        }
    };

    if (!isOpen) return null;

    const getBadgeIcon = (type: string) => {
        switch (type) {
            case 'first_rink': return <div className="w-10 h-10 rounded-full bg-linear-to-br from-bronze-400 to-bronze-600 flex items-center justify-center border-2 border-bronze-300 shadow-lg text-white"><MapPin className="w-5 h-5" /></div>;
            case 'ice_scout': return <div className="w-10 h-10 rounded-full bg-linear-to-br from-silver-400 to-silver-600 flex items-center justify-center border-2 border-silver-300 shadow-lg text-white"><FileText className="w-5 h-5" /></div>;
            case 'streak_master': return <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-red-600 flex items-center justify-center border-2 border-orange-300 shadow-lg text-white"><Flame className="w-5 h-5 fill-current" /></div>;
            case 'photographer': return <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center border-2 border-blue-300 shadow-lg text-white"><Trophy className="w-5 h-5" /></div>;
            case 'legend': return <div className="w-12 h-12 rounded-full bg-linear-to-br from-yellow-300 via-vegas-gold to-yellow-600 flex items-center justify-center border-2 border-yellow-200 shadow-xl text-puck-black"><Trophy className="w-6 h-6 fill-current" /></div>;

            // New Badges
            case 'early_bird': return <div className="w-10 h-10 rounded-full bg-linear-to-br from-sky-400 to-blue-500 flex items-center justify-center border-2 border-sky-300 shadow-lg text-white"><Sun className="w-5 h-5" /></div>;
            case 'night_owl': return <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-900 flex items-center justify-center border-2 border-indigo-400 shadow-lg text-white"><Moon className="w-5 h-5" /></div>;
            case 'weekend_warrior': return <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center border-2 border-emerald-300 shadow-lg text-white"><Calendar className="w-5 h-5" /></div>;
            case 'globe_trotter': return <div className="w-10 h-10 rounded-full bg-linear-to-br from-teal-400 to-cyan-600 flex items-center justify-center border-2 border-teal-300 shadow-lg text-white"><Globe className="w-5 h-5" /></div>;
            case 'cold_snap': return <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-200 to-white flex items-center justify-center border-2 border-white shadow-lg text-blue-500"><ThermometerSnowflake className="w-5 h-5" /></div>;
            case 'community_pillar': return <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-400 to-rose-600 flex items-center justify-center border-2 border-pink-300 shadow-lg text-white"><Users className="w-5 h-5" /></div>;

            default: return <div className="w-10 h-10 rounded-full bg-ice-white/10 flex items-center justify-center border border-ice-white/20"><Trophy className="w-4 h-4" /></div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-puck-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-puck-black/90 backdrop-blur-xl border border-ice-white/10 rounded-[32px] shadow-2xl p-6 md:p-8 text-ice-white relative overflow-hidden">

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-vegas-gold/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rink-blue/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter text-ice-white uppercase">USER <span className="text-vegas-gold">PROFILE</span></h2>
                            <p className="text-xs text-ice-white/60 font-bold tracking-wider mt-1">MANAGE ACCOUNT & THEMES</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-ice-white/60 hover:text-vegas-gold transition-colors p-2 hover:bg-ice-white/5 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Custom Notification Toast */}
                    {notification && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-4 duration-300 border-2 border-white/20">
                            <div className="bg-white/20 p-1 rounded-full">
                                <Check className="w-4 h-4 text-white" strokeWidth={4} />
                            </div>
                            <span className="font-black text-sm tracking-wider uppercase">{notification}</span>
                        </div>
                    )}

                    {!user ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center space-y-6">
                            <div className="w-20 h-20 bg-ice-white/5 rounded-full flex items-center justify-center mb-2">
                                <ShoppingBag className="w-10 h-10 text-ice-white/40" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-ice-white mb-2">Access Required</h3>
                                <p className="text-sm text-ice-white/60 max-w-xs mx-auto">Sign in to customize your manager profile, equip jerseys, and track your career stats.</p>
                            </div>
                            <a href="/auth" className="bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/20 text-vegas-gold px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-vegas-gold/10 transition-all hover:scale-105 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> SIGN IN TO ENTER
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Career Stats Cards */}
                            {stats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-ice-white/5 border border-ice-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-ice-white/10 transition-colors">
                                        <Trophy className="w-5 h-5 mb-2 text-vegas-gold group-hover:scale-110 transition-transform" />
                                        <p className="text-2xl font-black text-ice-white leading-none mb-1">{stats.total_points}</p>
                                        <p className="text-[10px] font-bold text-ice-white/40 tracking-wider">CONTRIBUTION POINTS</p>
                                    </div>
                                    <div className="bg-ice-white/5 border border-ice-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-ice-white/10 transition-colors">
                                        <MapPin className="w-5 h-5 mb-2 text-rink-blue group-hover:scale-110 transition-transform" />
                                        <p className="text-2xl font-black text-ice-white leading-none mb-1">{stats.rinks_added}</p>
                                        <p className="text-[10px] font-bold text-ice-white/40 tracking-wider">RINKS SCOUTED</p>
                                    </div>
                                    <div className="bg-ice-white/5 border border-ice-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-ice-white/10 transition-colors">
                                        <FileText className="w-5 h-5 mb-2 text-emerald-400 group-hover:scale-110 transition-transform" />
                                        <p className="text-2xl font-black text-ice-white leading-none mb-1">{stats.reports_submitted}</p>
                                        <p className="text-[10px] font-bold text-ice-white/40 tracking-wider">REPORTS FILED</p>
                                    </div>
                                    <div className="bg-ice-white/5 border border-ice-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-ice-white/10 transition-colors">
                                        <Flame className="w-5 h-5 mb-2 text-orange-500 group-hover:scale-110 transition-transform" />
                                        <p className="text-2xl font-black text-ice-white leading-none mb-1">{stats.current_streak}</p>
                                        <p className="text-[10px] font-bold text-ice-white/40 tracking-wider">DAY STREAK</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Left Column: Identity */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-ice-white/40 uppercase tracking-widest border-b border-ice-white/10 pb-2 mb-4">USER IDENTITY</h3>

                                    {/* Player Name */}
                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-ice-white/60 tracking-wider">DISPLAY NAME</label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full px-4 py-3 bg-ice-white/5 border border-ice-white/10 rounded-xl text-ice-white text-sm focus:border-vegas-gold/50 focus:bg-ice-white/10 outline-none transition-all placeholder-ice-white/20 font-bold"
                                            placeholder="Enter your name"
                                        />
                                    </div>

                                    {/* Neighborhood Team */}
                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-ice-white/60 tracking-wider">HOME DISTRICT</label>
                                        <div className="relative">
                                            <select
                                                value={neighborhoodTeam}
                                                onChange={(e) => setNeighborhoodTeam(e.target.value)}
                                                className="w-full px-4 py-3 bg-ice-white/5 border border-ice-white/10 rounded-xl text-ice-white text-sm font-bold focus:border-vegas-gold/50 focus:bg-ice-white/10 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="" className="bg-puck-black text-ice-white">Select a district...</option>
                                                {NEIGHBORHOOD_TEAMS.map(team => (
                                                    <option key={team} value={team} className="bg-puck-black text-ice-white">{team}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ice-white/40">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                        </div>

                                        {neighborhoodTeam === 'Custom' && (
                                            <input
                                                type="text"
                                                value={customTeam}
                                                onChange={(e) => setCustomTeam(e.target.value)}
                                                placeholder="Enter custom district name"
                                                className="w-full mt-2 px-4 py-3 bg-ice-white/5 border border-ice-white/10 rounded-xl text-ice-white text-sm font-bold focus:border-vegas-gold/50 outline-none"
                                            />
                                        )}
                                    </div>

                                    {/* Badges Section */}
                                    {badges.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold mb-3 text-ice-white/60 tracking-wider flex items-center gap-2">
                                                TROPHY CASE <span className="text-vegas-gold text-[10px]">({badges.length})</span>
                                            </h3>
                                            <div className="flex gap-2 flex-wrap">
                                                {badges.map((b) => {
                                                    const info = getBadgeInfo(b.badge_type as BadgeType);
                                                    return (
                                                        <div key={b.id} className="relative group hover:scale-110 transition-transform cursor-help" title={info.description}>
                                                            {getBadgeIcon(b.badge_type)}
                                                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-puck-black px-2 py-1 rounded-md text-[10px] font-bold text-ice-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-ice-white/20 pointer-events-none z-50 shadow-xl">
                                                                {info.name}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Customization */}
                                <div>
                                    <h3 className="text-xs font-black text-ice-white/40 uppercase tracking-widest border-b border-ice-white/10 pb-2 mb-4">PROFILE THEMES</h3>

                                    <div className="space-y-6">

                                        {/* INVENTORY: OWNED ITEMS ONLY */}
                                        <div className="grid grid-cols-3 gap-3">
                                            {/* Free Items */}
                                            {TEAM_COLORS.free.map(color => (
                                                <button
                                                    key={color.name}
                                                    type="button"
                                                    onClick={() => setSelectedColor(color.primary)}
                                                    className="group flex flex-col items-center gap-4 focus:outline-none"
                                                >
                                                    <div className="relative transition-transform duration-300 group-hover:scale-105">
                                                        <PlayerCard
                                                            avatarId={color.primary}
                                                            size="md"
                                                            className={cn(
                                                                "transition-all duration-300",
                                                                selectedColor === color.primary
                                                                    ? "ring-2 ring-emerald-500 ring-offset-4 ring-offset-black shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105 z-10"
                                                                    : "opacity-80 group-hover:opacity-100 group-hover:shadow-lg"
                                                            )}
                                                        />
                                                        {selectedColor === color.primary && (
                                                            <div className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-500 rounded-full border-2 border-black shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-in zoom-in spin-in-90 duration-300 z-20 flex items-center justify-center">
                                                                <Check className="w-3.5 h-3.5 text-white font-black" strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${selectedColor === color.primary ? 'text-emerald-400' : 'text-ice-white/40 group-hover:text-ice-white/80'}`}>
                                                        {color.name}
                                                    </span>
                                                </button>
                                            ))}

                                            {/* Heritage Pack (If Owned) */}
                                            {user.has_heritage_pack && TEAM_COLORS.heritage.map(color => (
                                                <button
                                                    key={color.name}
                                                    type="button"
                                                    onClick={() => setSelectedColor(color.primary)}
                                                    className="group flex flex-col items-center gap-4 focus:outline-none"
                                                >
                                                    <div className="relative transition-transform duration-300 group-hover:scale-105">
                                                        <PlayerCard
                                                            avatarId={color.primary}
                                                            size="md"
                                                            className={cn(
                                                                "transition-all duration-300",
                                                                selectedColor === color.primary
                                                                    ? "ring-2 ring-emerald-500 ring-offset-4 ring-offset-black shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105 z-10"
                                                                    : "opacity-80 group-hover:opacity-100 group-hover:shadow-lg"
                                                            )}
                                                        />
                                                        {selectedColor === color.primary && (
                                                            <div className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-500 rounded-full border-2 border-black shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-in zoom-in spin-in-90 duration-300 z-20 flex items-center justify-center">
                                                                <Check className="w-3.5 h-3.5 text-white font-black" strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${selectedColor === color.primary ? 'text-emerald-400' : 'text-ice-white/40 group-hover:text-ice-white/80'}`}>
                                                        {color.name.substring(0, 8)}..
                                                    </span>
                                                </button>
                                            ))}

                                            {/* Nostalgia Pack (If Owned) */}
                                            {user.has_nostalgia_pack && TEAM_COLORS.nostalgia.map(color => (
                                                <button
                                                    key={color.name}
                                                    type="button"
                                                    onClick={() => setSelectedColor(color.primary)}
                                                    className="group flex flex-col items-center gap-4 focus:outline-none"
                                                >
                                                    <div className="relative transition-transform duration-300 group-hover:scale-105">
                                                        <PlayerCard
                                                            avatarId={color.primary}
                                                            size="md"
                                                            className={cn(
                                                                "transition-all duration-300",
                                                                selectedColor === color.primary
                                                                    ? "ring-2 ring-emerald-500 ring-offset-4 ring-offset-black shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105 z-10"
                                                                    : "opacity-80 group-hover:opacity-100 group-hover:shadow-lg"
                                                            )}
                                                        />
                                                        {selectedColor === color.primary && (
                                                            <div className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-500 rounded-full border-2 border-black shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-in zoom-in spin-in-90 duration-300 z-20 flex items-center justify-center">
                                                                <Check className="w-3.5 h-3.5 text-white font-black" strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${selectedColor === color.primary ? 'text-emerald-400' : 'text-ice-white/40 group-hover:text-ice-white/80'}`}>
                                                        {color.name.substring(0, 8)}..
                                                    </span>
                                                </button>
                                            ))}

                                            {/* Enforcer Pack (If Owned) */}
                                            {user.has_enforcer_pack && TEAM_COLORS.enforcer.map(color => (
                                                <button
                                                    key={color.name}
                                                    type="button"
                                                    onClick={() => setSelectedColor(color.primary)}
                                                    className="group flex flex-col items-center gap-4 focus:outline-none"
                                                >
                                                    <div className="relative transition-transform duration-300 group-hover:scale-105">
                                                        <PlayerCard
                                                            avatarId={color.avatar}
                                                            size="md"
                                                            className={cn(
                                                                "transition-all duration-300",
                                                                selectedColor === color.primary
                                                                    ? "ring-2 ring-emerald-500 ring-offset-4 ring-offset-black shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105 z-10"
                                                                    : "opacity-80 group-hover:opacity-100 group-hover:shadow-lg"
                                                            )}
                                                        />
                                                        {selectedColor === color.primary && (
                                                            <div className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-500 rounded-full border-2 border-black shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-in zoom-in spin-in-90 duration-300 z-20 flex items-center justify-center">
                                                                <Check className="w-3.5 h-3.5 text-white font-black" strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${selectedColor === color.primary ? 'text-emerald-400' : 'text-ice-white/40 group-hover:text-ice-white/80'}`}>
                                                        {color.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Visit Pro Shop Button (If any unowned packs exist) */}
                                        {(!user.has_heritage_pack || !user.has_nostalgia_pack || !user.has_enforcer_pack) && (
                                            <button
                                                onClick={() => setShowProShop(true)}
                                                className="w-full mt-4 py-4 border-2 border-dashed border-ice-white/20 rounded-2xl flex items-center justify-center gap-3 group hover:border-vegas-gold/50 hover:bg-vegas-gold/5 transition-all"
                                            >
                                                <ShoppingBag className="w-5 h-5 text-vegas-gold group-hover:scale-110 transition-transform" />
                                                <div className="text-left">
                                                    <p className="text-xs font-black text-ice-white uppercase tracking-wider group-hover:text-vegas-gold transition-colors">VISIT PRO SHOP</p>
                                                    <p className="text-[10px] text-ice-white/40 font-bold">Unlock {(!user.has_heritage_pack ? 1 : 0) + (!user.has_nostalgia_pack ? 1 : 0) + (!user.has_enforcer_pack ? 1 : 0)} more equipment packs</p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer Actions */}
                            <div className="pt-6 mt-6 border-t border-ice-white/10 flex gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-ice-white py-4 font-black rounded-xl shadow-lg shadow-ice-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    {loading ? 'SAVING...' : 'SAVE PROFILE'}
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    title="Sign Out"
                                    aria-label="Sign Out"
                                    className="px-6 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-4 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}


                </div>
            </div>

            {/* Pro Shop Modal - Moved Outside Container to Fix Z-Index */}
            {
                showProShop && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-100 p-4 font-sans backdrop-blur-md">
                        <div className="w-full max-w-lg bg-[#111111] border border-ice-white/10 rounded-3xl p-6 md:p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
                            <button onClick={() => setShowProShop(false)} title="Close Shop" className="absolute top-4 right-4 text-ice-white/60 hover:text-white p-2 hover:bg-ice-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>

                            <div className="text-center mb-8">
                                <ShoppingBag className="w-12 h-12 text-vegas-gold mx-auto mb-4" />
                                <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">PRO <span className="text-vegas-gold">SHOP</span></h3>
                                <p className="text-sm text-ice-white/60 font-bold mt-2">EXCLUSIVE EQUIPMENT DROPS</p>
                            </div>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Heritage Pack */}
                                {!user?.has_heritage_pack && (
                                    <div className="bg-ice-white/5 border border-ice-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-ice-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h4 className="font-bold text-ice-white text-sm">HERITAGE PACK</h4>
                                                <p className="text-[10px] text-ice-white/60 font-bold mb-2">MTL, TOR, BOS Colors</p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {TEAM_COLORS.heritage.map(t => (
                                                        <button
                                                            key={t.name}
                                                            onClick={() => setPreviewAvatarId(t.avatar)}
                                                            className="relative w-8 h-10 bg-black/20 rounded-md border border-white/5 overflow-hidden hover:scale-110 hover:border-vegas-gold/50 transition-all"
                                                        >
                                                            <PlayerCard avatarId={t.avatar} size="sm" showName={false} className="w-full h-full !rounded-none border-none shadow-none" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handlePurchase('heritage_pack')}
                                            className="bg-vegas-gold/10 text-vegas-gold border border-vegas-gold/20 px-4 py-2 rounded-lg font-black text-xs uppercase hover:scale-105 transition-transform shadow-lg shadow-vegas-gold/10 flex flex-col items-center leading-none gap-1"
                                        >
                                            <span className="text-sm">$3.99</span>
                                            <span className="text-[8px] opacity-60 tracking-wider">BUY</span>
                                        </button>
                                    </div>
                                )}

                                {/* Nostalgia Pack */}
                                {!user?.has_nostalgia_pack && (
                                    <div className="bg-ice-white/5 border border-ice-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-ice-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h4 className="font-bold text-ice-white text-sm">RETRO PACK</h4>
                                                <p className="text-[10px] text-ice-white/60 font-bold mb-2">QUE, HFD, MIN Colors</p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {TEAM_COLORS.nostalgia.map(t => (
                                                        <button
                                                            key={t.name}
                                                            onClick={() => setPreviewAvatarId(t.avatar)}
                                                            className="relative w-8 h-10 bg-black/20 rounded-md border border-white/5 overflow-hidden hover:scale-110 hover:border-vegas-gold/50 transition-all"
                                                        >
                                                            <PlayerCard avatarId={t.avatar} size="sm" showName={false} className="w-full h-full !rounded-none border-none shadow-none" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handlePurchase('nostalgia_pack')}
                                            className="bg-vegas-gold/10 text-vegas-gold border border-vegas-gold/20 px-4 py-2 rounded-lg font-black text-xs uppercase hover:scale-105 transition-transform shadow-lg shadow-vegas-gold/10 flex flex-col items-center leading-none gap-1"
                                        >
                                            <span className="text-sm">$3.99</span>
                                            <span className="text-[8px] opacity-60 tracking-wider">BUY</span>
                                        </button>
                                    </div>
                                )}

                                {/* Enforcer Pack */}
                                {!user?.has_enforcer_pack && (
                                    <div className="bg-ice-white/5 border border-ice-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-ice-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h4 className="font-bold text-ice-white text-sm">ENFORCER PACK</h4>
                                                <p className="text-[10px] text-ice-white/60 font-bold mb-2">PHI Colors & Goon Status</p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {TEAM_COLORS.enforcer.map(t => (
                                                        <button
                                                            key={t.name}
                                                            onClick={() => setPreviewAvatarId(t.avatar)}
                                                            className="relative w-8 h-10 bg-black/20 rounded-md border border-white/5 overflow-hidden hover:scale-110 hover:border-vegas-gold/50 transition-all"
                                                        >
                                                            <PlayerCard avatarId={t.avatar} size="sm" showName={false} className="w-full h-full !rounded-none border-none shadow-none" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handlePurchase('enforcer_pack')}
                                            className="bg-vegas-gold/10 text-vegas-gold border border-vegas-gold/20 px-4 py-2 rounded-lg font-black text-xs uppercase hover:scale-105 transition-transform shadow-lg shadow-vegas-gold/10 flex flex-col items-center leading-none gap-1"
                                        >
                                            <span className="text-sm">$2.99</span>
                                            <span className="text-[8px] opacity-60 tracking-wider">BUY</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {user?.has_heritage_pack && user?.has_nostalgia_pack && user?.has_enforcer_pack && (
                                <div className="text-center py-8">
                                    <p className="text-vegas-gold font-bold mb-2">YOU OWN IT ALL!</p>
                                    <p className="text-ice-white/40 text-xs">More equipment drops coming soon.</p>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-ice-white/10 flex flex-col items-center gap-4">
                                <p className="text-xs text-ice-white/40 font-bold text-center max-w-xs leading-relaxed">
                                    Your support keeps RinkSpot free for everyone.
                                </p>
                                <button onClick={() => setShowProShop(false)} className="text-xs font-bold text-ice-white/40 hover:text-white transition-colors uppercase tracking-wider">Cancel</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Avatar Zoom Modal */}
            {previewAvatarId && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-in fade-in duration-200"
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
        </div >
    );
}

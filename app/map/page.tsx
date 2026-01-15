'use client';

import { useState, useEffect } from 'react';
import { useRinkData, Bounds } from '@/hooks/useRinkData';
import dynamic from 'next/dynamic';
import { Rink, Report } from '@/lib/supabase';
import { playSound, soundManager } from '@/lib/sounds';
import AddRinkModal from '@/components/AddRinkModal';
import LockerRoom from '@/components/LockerRoom';
import IntroModal from '@/components/IntroModal';
import RinkDetailModal from '@/components/RinkDetailModal';
import Leaderboard from '@/components/Leaderboard';
import Image from 'next/image';
import { CircleHelp, Trophy, Shirt, Plus, MapPin, X } from 'lucide-react';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

// Dynamic import to avoid SSR issues with Mapbox
const RetroMap = dynamic(() => import('@/components/RetroMap'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-rink-blue flex items-center justify-center text-ice-white font-sans animate-pulse">LOADING MAP...</div>,
});

export default function Home() {
    const { rinks, reports, loading: dataLoading, fetchRinksInBounds } = useRinkData();
    const [currentBounds, setCurrentBounds] = useState<Bounds | null>(null);

    const refreshData = () => {
        if (currentBounds) {
            fetchRinksInBounds(currentBounds);
        }
    };

    // UI State
    const [showIntro, setShowIntro] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLockerRoom, setShowLockerRoom] = useState(false);
    const [selectedRink, setSelectedRink] = useState<Rink | null>(null);
    const [showRinkDetail, setShowRinkDetail] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [initialLocation, setInitialLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [isPickingLocation, setIsPickingLocation] = useState(false);

    // Initial Logic
    useEffect(() => {
        // Check local storage for intro
        const hasSeenIntro = localStorage.getItem('hasSeenIntro');
        if (!hasSeenIntro) {
            setShowIntro(true);
        }
    }, []);

    const handleToggleMute = () => {
        const muted = soundManager.toggleMute();
        setIsMuted(muted);
    };

    const closeIntro = () => {
        setShowIntro(false);
        localStorage.setItem('hasSeenIntro', 'true');
    };

    // if (dataLoading) {
    //     return <div className="fixed inset-0 bg-rink-blue flex items-center justify-center text-ice-white font-sans animate-pulse">LOADING RINKS...</div>;
    // }

    return (
        <main className="relative w-screen h-screen overflow-hidden bg-rink-blue">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-10 bg-puck-black/80 backdrop-blur-md border-b border-ice-white/10 p-4 shadow-lg">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        {/* Title - Larger and bolder as requested, Puck removed */}
                        <h1 className="text-3xl md:text-4xl mt-1 tracking-tighter font-sans font-black italic uppercase flex items-center shadow-sm">
                            <span className="text-ice-white">RINK</span><span className="text-[#A5F2F3]">SPOT</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 md:space-x-4">
                        {/* Help/Instructions Button */}
                        <button
                            onClick={() => setShowIntro(true)}
                            className="w-10 h-10 rounded-full border border-ice-white/20 bg-ice-white/10 hover:bg-vegas-gold/20 flex items-center justify-center text-ice-white transition-all backdrop-blur-sm shadow-md hover:shadow-lg hover:scale-105 group"
                            title="Help / Instructions"
                        >
                            <CircleHelp className="w-5 h-5 group-hover:text-vegas-gold transition-colors" />
                        </button>

                        {/* Leaderboard Button */}
                        <button
                            onClick={() => {
                                setShowLeaderboard(true);
                                playSound('menu-beep');
                            }}
                            className="px-4 py-2 rounded-full border border-ice-white/20 bg-ice-white/10 hover:bg-vegas-gold/20 hover:border-vegas-gold/50 transition-all backdrop-blur-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                            title="Leaderboard"
                        >
                            <Trophy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="hidden md:inline text-xs text-ice-white font-bold tracking-wider font-sans group-hover:text-vegas-gold">LEADERBOARD</span>
                        </button>

                        {/* User avatar/Locker Room Button */}
                        <button
                            onClick={() => {
                                setShowLockerRoom(true);
                                playSound('menu-beep');
                            }}
                            className="px-4 py-2 rounded-full border border-ice-white/20 bg-vegas-gold/20 hover:bg-vegas-gold/40 hover:border-vegas-gold transition-all backdrop-blur-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                            title="User Profile"
                        >
                            <Shirt className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="hidden md:inline text-xs text-vegas-gold font-bold tracking-wider font-sans group-hover:text-ice-white">USER PROFILE</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Loading Indicator */}
            {dataLoading && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-puck-black/80 backdrop-blur-md px-4 py-1 rounded-full border border-vegas-gold/50 shadow-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-vegas-gold animate-pulse" />
                    <span className="text-[10px] font-bold text-vegas-gold tracking-widest uppercase font-sans">UPDATING MAP</span>
                </div>
            )}

            {/* Map */}
            <div className="absolute inset-0 pt-20">
                <RetroMap
                    rinks={rinks}
                    reports={reports}
                    onBoundsChange={(bounds) => {
                        setCurrentBounds(bounds);
                        fetchRinksInBounds(bounds);
                    }}
                    onRinkClick={(rink) => {
                        if (!isPickingLocation) {
                            setSelectedRink(rink);
                            playSound('menu-beep');
                        }
                    }}
                    onMapClick={(lat, lng) => {
                        if (isPickingLocation) {
                            setInitialLocation({ lat, lng });
                            setIsPickingLocation(false);
                            setShowAddModal(true);
                            playSound('menu-beep');
                        }
                    }}
                    cursor={isPickingLocation ? 'crosshair' : 'default'}
                />
            </div>

            {/* Map Pick Overlay */}
            {isPickingLocation && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-puck-black/90 backdrop-blur-xl border border-vegas-gold/50 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(180,151,90,0.3)] flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-vegas-gold animate-pulse shadow-[0_0_8px_rgba(180,151,90,0.8)]" />
                        <p className="text-xs font-black tracking-widest uppercase text-vegas-gold font-sans">
                            TAP MAP TO SET LOCATION
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setIsPickingLocation(false);
                            setShowAddModal(true);
                        }}
                        className="bg-puck-black/50 hover:bg-puck-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-ice-white/10 text-[10px] text-ice-white/60 hover:text-ice-white transition-all font-bold tracking-wider hover:scale-105 active:scale-95 font-sans"
                    >
                        CANCEL
                    </button>
                    {/* Crosshair cursor instruction/indicator could go here if needed, but the cursor change handles it on desktop */}
                </div>
            )}

            {/* Rink Detail Panel */}
            {selectedRink && !isPickingLocation && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-sm bg-puck-black/90 backdrop-blur-xl border border-ice-white/10 p-5 rounded-2xl shadow-2xl font-sans">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-black italic text-ice-white mb-1 uppercase tracking-tighter font-sans">{selectedRink.name}</h3>
                            <div className="flex items-center gap-1 text-ice-white/60">
                                <MapPin className="w-3 h-3" />
                                <p className="text-xs font-bold font-sans">
                                    {selectedRink.city}, {selectedRink.country}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedRink(null)}
                            className="text-ice-white/60 hover:text-vegas-gold transition-colors p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Popup Photo */}
                    {(() => {
                        const latestReportForPopup = reports.find(r => r.rink_id === selectedRink.id);
                        if (latestReportForPopup?.photo_url) {
                            return (
                                <div className="mb-4 h-32 relative rounded-xl overflow-hidden shadow-lg border border-ice-white/10 group">
                                    <Image
                                        src={latestReportForPopup.photo_url}
                                        alt="Rink View"
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110 image-smooth"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                        <span className="text-[10px] font-black tracking-widest text-white shadow-black drop-shadow-md">LIVE VIEW</span>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center bg-ice-white/5 p-3 rounded-lg border border-ice-white/5">
                            <span className="text-xs font-bold text-ice-white/60 font-sans">TYPE</span>
                            <span className="text-vegas-gold text-xs font-black tracking-widest font-sans">{selectedRink.rink_type.toUpperCase()}</span>
                        </div>
                        {selectedRink.address && (
                            <div className="text-xs text-ice-white/60 px-1 truncate font-sans">
                                {selectedRink.address}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            playSound('menu-beep');
                            setShowRinkDetail(true);
                        }}
                        className="w-full bg-vegas-gold hover:bg-vegas-gold/90 text-puck-black py-3 font-black text-xs rounded-xl shadow-xl shadow-vegas-gold/30 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2 font-sans"
                    >
                        VIEW FULL DETAILS
                    </button>
                </div>
            )}

            {/* Add Rink Modal */}
            <AddRinkModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={refreshData}
                initialLocation={initialLocation}
                onPickLocation={() => {
                    setShowAddModal(false);
                    setIsPickingLocation(true);
                }}
            />

            {/* Locker Room Modal */}
            <LockerRoom
                isOpen={showLockerRoom}
                onClose={() => setShowLockerRoom(false)}
            />

            {/* Rink Detail Modal */}
            <RinkDetailModal
                rink={selectedRink}
                isOpen={showRinkDetail}
                onClose={() => setShowRinkDetail(false)}
            />

            {/* Leaderboard Modal */}
            <Leaderboard
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
            />

            {/* Footer Info */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 w-full px-4 flex justify-center pointer-events-auto">
                <div className="flex items-center gap-3 bg-puck-black/80 backdrop-blur-xl px-1.5 py-1.5 rounded-full border border-ice-white/10 shadow-2xl">
                    <button
                        onClick={() => {
                            setInitialLocation(undefined);
                            setShowAddModal(true);
                            playSound('menu-beep');
                        }}
                        className="flex items-center gap-3 bg-ice-white/5 hover:bg-ice-white/10 px-4 py-2 rounded-full transition-all active:scale-95 group"
                    >
                        <span className="w-8 h-5 bg-vegas-gold rounded-lg flex items-center justify-center shadow-lg shadow-vegas-gold/20 border border-ice-white/20 group-hover:scale-110 transition-transform">
                            <Plus className="w-3 h-3 text-puck-black stroke-[4px]" />
                        </span>
                        <span className="text-[10px] font-black text-ice-white tracking-wider font-sans group-hover:text-vegas-gold transition-colors">ADD RINK</span>
                    </button>

                    <div className="h-4 w-px bg-ice-white/10"></div>

                    <div className="px-4 h-9 flex items-center justify-center">
                        <span className="text-[10px] font-black text-ice-white/60 tracking-wider font-sans flex items-center gap-1">
                            <span className="text-vegas-gold text-xs">{rinks.length}</span>
                            <span>WORLDWIDE</span>
                        </span>
                    </div>
                </div>
            </div>

            <IntroModal isOpen={showIntro} onClose={closeIntro} />
        </main>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { playSound } from '@/lib/sounds';

interface IntroModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Converted to Glassmorphism & Lucide Icons
import { Snowflake, Plus, FileText, Check } from 'lucide-react';

export default function IntroModal({ isOpen, onClose }: IntroModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-puck-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
            <div className="w-full max-w-lg bg-puck-black/90 backdrop-blur-xl border border-ice-white/10 text-ice-white relative rounded-3xl shadow-2xl p-8">

                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter mb-2 uppercase"><span className="text-ice-white">RINK</span><span className="text-[#A5F2F3]">SPOT</span></h1>
                    <p className="text-xs font-bold font-sans text-ice-white/60 tracking-[0.2em] uppercase">How RinkSpot Works</p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-ice-white/5 rounded-2xl border border-ice-white/10 shrink-0">
                            <Snowflake className="w-6 h-6 text-ice-white" />
                        </div>
                        <div>
                            <h3 className="text-vegas-gold mb-1 font-bold text-sm tracking-wider">CHECK CONDITIONS</h3>
                            <p className="text-ice-white/60 text-xs leading-relaxed">
                                Tap any rink marker on the map to see real-time ice quality, crowd levels, and weather.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-ice-white/5 rounded-2xl border border-ice-white/10 shrink-0">
                            <Plus className="w-6 h-6 text-status-good" />
                        </div>
                        <div>
                            <h3 className="text-vegas-gold mb-1 font-bold text-sm tracking-wider">ADD RINKS</h3>
                            <p className="text-ice-white/60 text-xs leading-relaxed">
                                See a hidden gem? Click the <span className="text-status-good font-bold">Floating Puck</span> to add new rinks to the map.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-ice-white/5 rounded-2xl border border-ice-white/10 shrink-0">
                            <FileText className="w-6 h-6 text-vegas-gold" />
                        </div>
                        <div>
                            <h3 className="text-vegas-gold mb-1 font-bold text-sm tracking-wider">REPORT & EARN</h3>
                            <p className="text-ice-white/60 text-xs leading-relaxed">
                                Submit condition reports to earn points. Customize your avatar in the <span className="text-ice-white font-bold">Locker Room</span>!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-ice-white/10 text-center">
                    <button
                        onClick={() => {
                            playSound('start-game');
                            onClose();
                        }}
                        className="w-full bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/20 text-vegas-gold py-4 text-sm font-black rounded-xl shadow-lg shadow-vegas-gold/10 hover:scale-[1.02] active:scale-[0.98] transition-all tracking-wider uppercase flex items-center justify-center gap-2"
                    >
                        START EXPLORING
                    </button>
                    <p className="mt-4 text-[10px] font-bold text-ice-white/20 tracking-widest font-sans uppercase">
                        Discover rinks and conditions
                    </p>
                </div>
            </div>
        </div>
    );
}

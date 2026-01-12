'use client';

import { CrowdLevel } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface CrowdMeterProps {
    level: CrowdLevel;
    onChange?: (level: CrowdLevel) => void;
    interactive?: boolean;
    showAnimation?: boolean; // Kept for prop compatibility but unused visually now
    minimal?: boolean;
}

const levels: { id: CrowdLevel; label: string; color: string; width: string; }[] = [
    { id: 'empty', label: 'Empty', color: 'bg-ice-white/20', width: '0%' },
    { id: 'light', label: 'Light', color: 'bg-emerald-500', width: '33%' },
    { id: 'medium', label: 'Medium', color: 'bg-orange-500', width: '66%' },
    { id: 'packed', label: 'Packed', color: 'bg-red-500', width: '100%' },
];

export default function CrowdMeter({ level, onChange, interactive = false, minimal = false }: CrowdMeterProps) {
    // Find current level index
    const currentIndex = levels.findIndex(l => l.id === level);
    const currentLevel = levels[currentIndex !== -1 ? currentIndex : 0];

    const handleSelect = (selectedLevel: CrowdLevel) => {
        if (interactive && onChange) {
            onChange(selectedLevel);
        }
    };

    return (
        <div className={cn("w-full", minimal && "w-auto")}>
            {!minimal && <h3 className="text-xs font-bold mb-3 text-ice-white/60 tracking-wider">CROWD LEVEL</h3>}

            <div className="flex items-center gap-4">
                {/* Visual Sprite Removed per user request */}

                {/* The Meter Bar */}
                <div className="flex-1 space-y-2">
                    {/* Bar Container */}
                    <div className="relative h-8 bg-black/40 rounded-lg border border-ice-white/10 overflow-hidden backdrop-blur-sm shadow-inner">
                        {/* Fill Element */}
                        <div
                            className={cn(
                                "h-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(255,255,255,0.1)]",
                                currentLevel.color
                            )}
                            style={{ width: currentLevel.width === '0%' ? '0%' : currentLevel.width }}
                        />

                        {/* Interactive Segments Overlay */}
                        <div className="absolute inset-0 flex">
                            {levels.map((l) => (
                                <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => handleSelect(l.id)}
                                    disabled={!interactive}
                                    className={cn(
                                        "flex-1 h-full border-r border-white/5 last:border-0 hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/10 group",
                                        !interactive && "cursor-default hover:bg-transparent"
                                    )}
                                    title={l.label}
                                >
                                    <span className="sr-only">{l.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="flex justify-between px-1">
                        {levels.map((l) => (
                            <div
                                key={l.id}
                                onClick={() => handleSelect(l.id)}
                                className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer select-none",
                                    level === l.id ? "text-ice-white scale-110" : "text-ice-white/30 hover:text-ice-white/60"
                                )}
                            >
                                {l.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AVATAR_MAP } from '@/lib/avatars';

interface PlayerCardProps {
    avatarId: string;
    className?: string;
    showName?: boolean;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function PlayerCard({
    avatarId,
    className,
    showName = false,
    name,
    size = 'md'
}: PlayerCardProps) {

    // Helper to get image path (handles both old sprites and new cards)
    const getAvatarPath = (id: string) => {
        const spriteName = AVATAR_MAP[id];
        // Check if it's a new card asset
        if (spriteName && spriteName.startsWith('card-')) {
            return `/avatars/${spriteName}.png`;
        }
        // Fallback for legacy sprites
        return `/sprites/${spriteName}.png`;
    };

    const sizeClasses = {
        sm: 'w-12 h-16',   // Leaderboard small
        md: 'w-24 h-32',   // Selector
        lg: 'w-48 h-64',   // Profile main
        xl: 'w-64 h-80',   // Hero
    };

    return (
        <div className={cn("relative group transition-all duration-300", sizeClasses[size], className)}>
            <div className={cn(
                "relative w-full h-full rounded-xl overflow-hidden shadow-lg border border-ice-white/10 bg-ice-white/5",
                "group-hover:shadow-[0_0_20px_rgba(180,151,90,0.3)] group-hover:border-vegas-gold/50 transition-all"
            )}>
                {/* Glow Effect behind */}
                <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/60 z-10" />

                <Image
                    src={getAvatarPath(avatarId) || '/sprites/player-medium.png'}
                    alt={name || "Player Avatar"}
                    fill
                    className="object-contain"
                />

                {/* Optional Name Overlay */}
                {showName && name && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 z-20 text-center">
                        <p className="text-[10px] md:text-xs font-black text-ice-white uppercase tracking-wider text-shadow-sm truncate">
                            {name}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

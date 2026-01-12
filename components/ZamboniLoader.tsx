'use client';

import Image from 'next/image';

export default function ZamboniLoader() {
    return (
        <div className="fixed inset-0 bg-rink-blue flex flex-col items-center justify-center z-50">
            {/* Zamboni animation */}
            <div className="relative w-full h-32 overflow-hidden mb-8">
                <div className="absolute animate-zamboni-slide">
                    <Image
                        src="/sprites/zamboni.png"
                        alt="Zamboni"
                        width={128}
                        height={128}
                        className=""
                    />
                </div>
            </div>

            {/* Loading text */}
            <div className="text-ice-white text-sm text-nes-shadow mb-4 animate-blink">
                RESURFACING...
            </div>

            {/* Ice trail progress bar */}
            <div className="w-64 h-4 border-4 border-ice-white bg-puck-black">
                <div className="h-full bg-gradient-to-r from-status-frozen to-ice-white animate-pulse" />
            </div>

            {/* Retro corner decorations removed for cleaner look */}
        </div>
    );
}

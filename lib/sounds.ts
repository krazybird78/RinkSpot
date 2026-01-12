// import { Howl, Howler } from 'howler';

// No-op sound manager to remove audio warnings and functionality
// User request: remove audio stuff

class SoundManager {
    constructor() {
        // Audio disabled
    }

    play(name: string) {
        // No-op
    }

    stop(name: string) {
        // No-op
    }

    stopAll() {
        // No-op
    }

    setMuted(muted: boolean) {
        // No-op
    }

    toggleMute() {
        return true;
    }

    isMuted() {
        return true;
    }
}

export const soundManager = new SoundManager();

export const playSound = (name: string) => {
    // No-op
};

export const stopSound = (name: string) => {
    // No-op
};

export const toggleMute = () => {
    return true;
};

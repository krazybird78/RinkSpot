export const AVATAR_MAP: Record<string, string> = {
    // Sunbelt (Free) - Modern Cards
    'vegas-gold': 'card-vegas',
    'florida-teal': 'card-florida',
    'arizona-grey': 'card-arizona',

    // Heritage - Modern Cards
    'montreal-red': 'card-montreal',
    'toronto-blue': 'card-toronto',
    'boston-gold': 'card-boston',

    // Nostalgia - Modern Cards
    'quebec-blue': 'card-quebec',
    'hartford-green': 'card-hartford',
    'minnesota-green': 'card-minnesota',

    // Enforcer - Modern Cards
    'enforcer-1': 'card-enforcer-1',
    'enforcer-2': 'card-enforcer-2',
};

export const getAvatarUrl = (avatarId?: string) => {
    if (!avatarId || !AVATAR_MAP[avatarId]) return null;
    return `/sprites/${AVATAR_MAP[avatarId]}.png`;
};

// Also exporting the Team Colors structure for LockerRoom reuse would be ideal,
// but for now let's minimalize changes and just expose the mapping which is the critical shared part.
// Actually, let's keep it simple for now as planned.

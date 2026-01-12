import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'RinkSpot - Find Outdoor Rinks',
        short_name: 'RinkSpot',
        description: 'Find and share the status of outdoor ice rinks in your neighborhood.',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a365d',
        theme_color: '#B4975A',
        icons: [
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}

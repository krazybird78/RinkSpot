# 🏒 RinkSpot - Worldwide Ice Rink Discovery

A global ice rink discovery platform with 1988 NES Ice Hockey aesthetics. Find rinks, check crowd levels, view ice quality, and report real-time conditions.

![RinkSpot](public/sprites/puck_sprite_1767555502554.png)

## 🎮 Features

- **Retro NES Aesthetics**: 1988 Ice Hockey-inspired pixel art and chiptune sounds
- **Global Rink Database**: Discover ice rinks worldwide
- **Real-Time Status**: Check crowd levels and ice conditions
- **Weather Integration**: Automatic ice status based on temperature
- **Interactive Map**: Mapbox-powered retro-styled world map
- **Monetization**: Heritage Pack ($2.99) unlocks classic team colors

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account (free tier available)
- Mapbox API token (free tier: 50k loads/month)
- OpenWeatherMap API key (free tier: 1M calls/month)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd rinkspot
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_access_token
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Set up Supabase database:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the migration file: `supabase/migrations/20260104_initial_schema.sql`

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🗺️ Getting API Keys

### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project (free tier available)
3. Get your project URL and anon key from Settings → API

### Mapbox
1. Go to [mapbox.com](https://mapbox.com)
2. Sign up for free account
3. Create an access token from Account → Access Tokens

### OpenWeatherMap
1. Go to [openweathermap.org](https://openweathermap.org/api)
2. Sign up for free account
3. Get your API key from API Keys section

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom NES palette
- **Database**: Supabase (PostgreSQL)
- **Maps**: Mapbox GL JS
- **Audio**: Howler.js
- **Payments**: Stripe (coming soon)
- **Deployment**: Vercel

## 📁 Project Structure

```
rinkspot/
├── app/
│   ├── page.tsx              # Main homepage with map
│   ├── globals.css           # NES-style global CSS
│   └── layout.tsx            # Root layout
├── components/
│   ├── RetroMap.tsx          # Mapbox map with pixel markers
│   ├── CrowdMeter.tsx        # Animated crowd level display
│   ├── AddRinkModal.tsx      # Add rink form
│   └── ZamboniLoader.tsx     # Loading screen
├── lib/
│   ├── supabase.ts           # Supabase client & types
│   ├── weather.ts            # OpenWeatherMap integration
│   └── sounds.ts             # Chiptune sound manager
├── public/
│   ├── sprites/              # Pixel art assets
│   └── sounds/               # Chiptune audio files
└── supabase/
    └── migrations/           # Database schema
```

## 🎵 Sound Effects

The app uses chiptune sounds for:
- **Zamboni Hum**: App startup
- **Goal Horn**: Successful rink submission
- **Skate Scratch**: Map interactions
- **Menu Beep**: Button clicks

> **Note**: Sound files need to be added to `public/sounds/`. You can generate 8-bit sounds using tools like [BeepBox](https://beepbox.co) or [ChipTone](https://sfbgames.itch.io/chiptone).

## 🎮 Color Palette

### Free "Sunbelt" Colors
- Vegas Gold: `#B4975A`
- Florida Teal: `#041E42`
- Arizona Grey: `#8C2633`

### Premium "Heritage Pack" Colors (Original Six)
- **Montreal Canadiens**: Red `#AF1E2D`, Blue `#192168`
- **Toronto Maple Leafs**: Blue `#003E7E`, White `#FFFFFF`
- **Boston Bruins**: Gold `#FFB81C`, Black `#000000`
- **Detroit Red Wings**: Red `#CE1126`, White `#FFFFFF`

## 🚧 Roadmap

- [ ] User authentication (Supabase Auth)
- [ ] Neighborhood team selection
- [ ] Stripe payment integration for Heritage Pack
- [ ] Photo uploads with 8-bit filter
- [ ] Leaderboard system
- [ ] PWA support for mobile installation
- [ ] Rink detail pages
- [ ] User profiles ("Locker Room")

## 📝 License

MIT

## 🏒 Credits

Inspired by the 1988 NES Ice Hockey game. Built with ❄️ for the global hockey community.

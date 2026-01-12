import { createClient } from '@supabase/supabase-js';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Ensure we have a valid URL (must start with http/https) or fall back to a dummy one to prevent crash
const supabaseUrl = (envUrl && envUrl.startsWith('http'))
    ? envUrl
    : 'https://placeholder.supabase.co';

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export type IceStatus = 'frozen' | 'good' | 'slush' | 'melted';
export type CrowdLevel = 'empty' | 'light' | 'medium' | 'packed';
export type RinkType = 'outdoor' | 'indoor' | 'pond';

export interface User {
    id: string;
    email: string;
    display_name: string;
    neighborhood_team: string;
    avatar_id?: string;
    has_heritage_pack: boolean;
    has_enforcer_pack: boolean;
    has_nostalgia_pack: boolean;
    created_at: string;
}

export interface Rink {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    rink_type: RinkType;
    created_by: string;
    created_at: string;
}

export interface Report {
    id: string;
    rink_id: string;
    user_id: string;
    crowd_level: CrowdLevel;
    ice_status: IceStatus;
    temperature: number;
    user_override: boolean;
    photo_url?: string;
    created_at: string;
    users?: {
        display_name: string;
        avatar_id?: string;
    }; // Joined fields
}

export interface Leaderboard {
    id: string;
    neighborhood_team: string;
    total_reports: number;
    week_start: string;
    rank: number;
}

export type DeletionStatus = 'pending' | 'confirmed';

export interface DeletionRequest {
    id: string;
    rink_id: string;
    requested_by: string;
    confirmed_by?: string;
    status: DeletionStatus;
    created_at: string;
    scheduled_deletion_at?: string;
}


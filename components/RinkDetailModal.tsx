'use client';


import { useState, useEffect } from 'react';
import { supabase, Rink, Report } from '@/lib/supabase';
import { AVATAR_MAP } from '@/lib/avatars';
import Image from 'next/image';
import { playSound } from '@/lib/sounds';
import { calculateAverageRating } from '@/lib/ratings';
import { getWeather, getIceStatus, getIcePredictionMessage, WeatherData } from '@/lib/weather';
// Lucid Icons
import { MapPin, Thermometer, Users, Trash2, Snowflake, FileText, Star, X, CircleHelp } from 'lucide-react';
import CrowdMeter from './CrowdMeter';
import AddReportModal from './AddReportModal';
import PlayerCard from '@/components/PlayerCard';

interface RinkDetailModalProps {
    rink: Rink | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function RinkDetailModal({ rink, isOpen, onClose }: RinkDetailModalProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [averageRating, setAverageRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [showAddReport, setShowAddReport] = useState(false);
    const [deletionRequest, setDeletionRequest] = useState<any | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [previewAvatarId, setPreviewAvatarId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && rink) {
            loadReports();
            loadDeletionStatus();
            checkUser();
        }
    }, [isOpen, rink]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

    const loadDeletionStatus = async () => {
        if (!rink) return;
        const { data } = await supabase
            .from('deletion_requests')
            .select('*')
            .eq('rink_id', rink.id)
            .maybeSingle(); // Use maybeSingle to avoid 406 error if none exists
        setDeletionRequest(data);
    };

    const handleRequestDeletion = async () => {
        if (!currentUserId || !rink) return;

        const confirm = window.confirm('Are you sure you want to request deletion for this rink? Another user will need to confirm it.');
        if (!confirm) return;

        const { error } = await supabase
            .from('deletion_requests')
            .insert({
                rink_id: rink.id,
                requested_by: currentUserId,
            });

        if (error) {
            alert('Error requesting deletion.');
            console.error(error);
        } else {
            alert('Deletion requested. Waiting for community confirmation.');
            loadDeletionStatus();
        }
    };

    const handleConfirmDeletion = async () => {
        if (!currentUserId || !deletionRequest) return;

        const confirm = window.confirm('Confirm deletion? This will start a 7-day countdown to permanent removal.');
        if (!confirm) return;

        // Set scheduled time to 7 days from now
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 7);

        const { error } = await supabase
            .from('deletion_requests')
            .update({
                status: 'confirmed',
                confirmed_by: currentUserId,
                scheduled_deletion_at: scheduledDate.toISOString(),
            })
            .eq('id', deletionRequest.id);

        if (error) {
            alert('Error confirming deletion.');
            console.error(error);
        } else {
            alert('Deletion confirmed. Rink will be removed in 7 days.');
            loadDeletionStatus();
        }
    };

    const loadReports = async () => {
        if (!rink) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*, users(display_name, avatar_id)')
                .eq('rink_id', rink.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setReports(data || []);

            // Calculate average rating
            const rating = await calculateAverageRating(rink.id);
            setAverageRating(rating);

            // Fetch weather
            console.log('Fetching weather for rink:', rink.name, rink.latitude, rink.longitude);
            const weatherData = await getWeather(rink.latitude, rink.longitude);
            console.log('Weather data received:', weatherData);
            setWeather(weatherData);

        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !rink) return null;

    const latestReport = reports[0];

    return (
        <div className="fixed inset-0 bg-puck-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            {!showAddReport && (
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-ice-white/10 bg-puck-black/90 backdrop-blur-xl text-ice-white p-6 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-ice-white">{rink.name}</h2>
                            {averageRating.count > 0 && (
                                <p className="text-xs font-bold text-vegas-gold mt-1">
                                    ⭐ {averageRating.average}/5 ({averageRating.count} {averageRating.count === 1 ? 'review' : 'reviews'})
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-ice-white hover:text-vegas-gold text-xl cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Rink Info */}
                    <div className="grid grid-cols-2 gap-4 mb-8 text-xs">
                        <div>
                            <span className="text-ice-white/60 font-medium">Type:</span>
                            <p className="text-vegas-gold font-bold">{rink.rink_type.toUpperCase()}</p>
                        </div>
                        <div>
                            <span className="text-ice-white/60 font-medium">Location:</span>
                            <p className="text-ice-white font-bold">{rink.city}, {rink.country}</p>
                        </div>
                        {rink.address && (
                            <div className="col-span-2">
                                <span className="text-ice-white/60 font-medium">Address:</span>
                                <p className="text-ice-white font-bold">{rink.address}</p>
                            </div>
                        )}
                    </div>

                    {/* Latest Report */}
                    {latestReport && (
                        <div className="mb-6 p-5 border border-status-good/30 bg-status-good/5 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-2 right-2 p-2 opacity-10 pointer-events-none">
                                <Snowflake className="w-20 h-20 text-status-good drop-shadow-lg" />
                            </div>
                            <h3 className="text-sm font-black text-status-good mb-4 uppercase tracking-wider flex items-center gap-2 relative z-10">
                                <Snowflake className="w-4 h-4" /> LATEST CONDITIONS
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-ice-white/60 font-medium">Ice Status:</span>
                                    <p className="text-ice-white font-bold text-lg">{latestReport.ice_status.toUpperCase()}</p>
                                </div>
                                <div className="col-span-2 mt-3">
                                    <CrowdMeter
                                        level={latestReport.crowd_level}
                                        interactive={false}
                                        showAnimation={false}
                                        minimal={true}
                                    />
                                </div>
                                {latestReport.photo_url && (
                                    <div className="col-span-2 mt-2 rounded-xl overflow-hidden border border-ice-white/10 shadow-lg relative h-48 group">
                                        <img
                                            src={latestReport.photo_url}
                                            alt="Rink Condition"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 image-smooth"
                                            style={{ imageRendering: 'auto' }}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                            <p className="text-[10px] text-ice-white/80 font-bold flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE CAM
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="col-span-2 flex flex-col sm:flex-row sm:items-center justify-between border-t-2 border-status-good/30 pt-3 mt-2 gap-2 sm:gap-0">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (latestReport.users?.avatar_id) setPreviewAvatarId(latestReport.users.avatar_id);
                                            }}
                                            title="View Avatar"
                                            className="shrink-0 w-8 h-8 flex items-center justify-center bg-puck-black/50 rounded-lg border border-ice-white/20 hover:scale-110 hover:border-vegas-gold transition-all overflow-hidden relative group"
                                        >
                                            <PlayerCard
                                                avatarId={latestReport.users?.avatar_id || 'vegas-gold'}
                                                size="sm"
                                                showName={false}
                                                className="w-full h-full !rounded-none border-none shadow-none transform scale-125"
                                            />
                                        </button>
                                        <span className="text-ice-white text-xs font-bold truncate max-w-[140px]">
                                            {latestReport.users?.display_name || 'Anonymous'}
                                        </span>
                                    </div>
                                    <div className="text-ice-white/60 text-[10px] text-right sm:text-left font-medium">
                                        {new Date(latestReport.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Live Weather */}
                    {weather && (
                        <div className="mb-6 p-5 border border-vegas-gold/20 bg-vegas-gold/5 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-2 right-2 p-2 opacity-10 pointer-events-none">
                                <Thermometer className="w-20 h-20 text-vegas-gold drop-shadow-lg" />
                            </div>
                            <h3 className="text-sm font-black text-vegas-gold mb-4 uppercase tracking-wider flex items-center gap-2 relative z-10">
                                <Thermometer className="w-4 h-4" /> LIVE WEATHER
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-xs relative z-10">
                                <div>
                                    <span className="text-ice-white/60 font-bold text-[10px] uppercase">Temperature</span>
                                    <p className="text-ice-white font-black text-2xl tracking-tighter">{weather.temperature}°C</p>
                                    <p className="text-ice-white/40 text-[10px]">Feels like {weather.feelsLike}°C</p>
                                </div>
                                <div>
                                    <span className="text-ice-white/60 font-bold text-[10px] uppercase">Conditions</span>
                                    <p className="text-ice-white font-bold capitalize text-lg tracking-tight">{weather.description}</p>
                                </div>
                                <div className="col-span-2 bg-puck-black/40 p-3 rounded-xl border border-ice-white/10 mt-2 backdrop-blur-sm">
                                    <span className="text-vegas-gold text-[10px] font-bold tracking-widest uppercase mb-1 block">ICE FORECAST</span>
                                    <p className="text-ice-white text-xs leading-snug font-medium opacity-90">
                                        {getIcePredictionMessage(weather.temperature, getIceStatus(weather.temperature))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Reports */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-ice-white/60 mb-3 tracking-wider flex items-center gap-2 uppercase">
                            <FileText className="w-4 h-4" /> RECENT REPORTS
                        </h3>
                        {loading ? (
                            <p className="text-xs text-ice-white/60">Loading...</p>
                        ) : reports.length === 0 ? (
                            <p className="text-xs text-ice-white/60">No reports yet. Be the first to report!</p>
                        ) : (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {reports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="p-3 border border-ice-white/10 bg-ice-white/5 text-[10px] rounded-xl hover:bg-ice-white/10 transition-colors"
                                    >
                                        <div className="flex justify-between mb-1">
                                            <span className={`text-status-${report.ice_status} font-bold`}>
                                                ICE: {report.ice_status.toUpperCase()}
                                            </span>
                                            <span className="text-ice-white/80 font-medium">
                                                CROWD: {report.crowd_level.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-ice-white/50 text-[9px] font-medium">
                                            {new Date(report.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => {
                                if (deletionRequest?.status === 'confirmed') {
                                    alert('This rink is scheduled for deletion and cannot accept new reports.');
                                    return;
                                }
                                playSound('menu-beep');
                                setShowAddReport(true);
                            }}
                            disabled={deletionRequest?.status === 'confirmed'}
                            className={`flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-ice-white text-xs py-4 font-bold rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-ice-white/5 ${deletionRequest?.status === 'confirmed' ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                        >
                            <FileText className="w-4 h-4" /> UPDATE CONDITIONS
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-4 bg-ice-white/5 hover:bg-ice-white/10 text-ice-white border border-ice-white/10 text-xs font-bold rounded-xl transition-all uppercase tracking-widest"
                        >
                            CLOSE
                        </button>
                    </div>

                    {/* Deletion Controls */}
                    <div className="mt-8 pt-4 border-t border-ice-white/10">
                        {!deletionRequest ? (
                            <button
                                onClick={handleRequestDeletion}
                                className="w-full bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md border border-red-500/30 text-ice-white text-xs py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/10"
                            >
                                <Trash2 className="w-4 h-4" /> REQUEST RINK DELETION
                            </button>
                        ) : deletionRequest.status === 'pending' ? (
                            <div className="p-3 bg-vegas-gold/5 border border-vegas-gold/20 border-dashed rounded-xl text-center">
                                <p className="text-[9px] text-vegas-gold mb-2 font-bold uppercase tracking-wider">⚠ DELETION REQUESTED</p>
                                {deletionRequest.requested_by === currentUserId ? (
                                    <p className="text-[8px] text-ice-white/60">Waiting for another user to confirm...</p>
                                ) : (
                                    <button
                                        onClick={handleConfirmDeletion}
                                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] rounded-lg border border-red-500/20 font-bold uppercase tracking-wide transition-colors"
                                    >
                                        CONFIRM DELETION
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                                    <Trash2 className="w-3 h-3 inline mr-1" />
                                    SCHEDULED FOR DELETION
                                </p>
                                <p className="text-[8px] text-ice-white/60 mt-1">
                                    Removes on: {new Date(deletionRequest.scheduled_deletion_at).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <AddReportModal
                rinkId={rink.id}
                rinkName={rink.name}
                latitude={rink.latitude}
                longitude={rink.longitude}
                isOpen={showAddReport}
                onClose={() => setShowAddReport(false)}
                onSuccess={() => {
                    loadReports();
                    // Also refresh parent map data if needed? For now just local reports.
                }}
            />

            {/* Avatar Zoom Modal */}
            {previewAvatarId && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-in fade-in duration-200"
                    onClick={() => setPreviewAvatarId(null)}
                >
                    <div className="relative animate-in zoom-in-95 duration-300 pointer-events-none">
                        {/* We use a large PlayerCard here. We need to import PlayerCard.
                            Wait, PlayerCard is not imported. I need to add the import.
                            I will do that in a separate edit or include it at the top of the file.
                            For now, assuming I will add the import, let's use it.
                          */}
                        <PlayerCard avatarId={previewAvatarId} size="xl" className="shadow-[0_0_100px_rgba(180,151,90,0.3)] pointer-events-auto" />
                        <button
                            className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-ice-white/50 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors pointer-events-auto"
                        >
                            Tap to close
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
}

// Helper for importing PlayerCard if it's not already there.
// Since I can't add imports easily with replace_file_content if I'm targeting the bottom,
// I'll assume I need to do a multi-replace or two edits.
// Actually, I'll use multi_replace_file_content to do both import and render logic changes.


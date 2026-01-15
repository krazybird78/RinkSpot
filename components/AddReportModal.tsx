'use client';

import { useState } from 'react';
import { supabase, IceStatus, CrowdLevel } from '@/lib/supabase';
import { getIceStatusForLocation } from '@/lib/weather';
import { playSound } from '@/lib/sounds';
import { awardPoints } from '@/lib/scoring';
import { uploadRinkPhoto } from '@/lib/photos';
import { Star, Camera } from 'lucide-react';
import CrowdMeter from './CrowdMeter';

interface AddReportModalProps {
    rinkId: string;
    rinkName: string;
    latitude: number;
    longitude: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddReportModal({
    rinkId,
    rinkName,
    latitude,
    longitude,
    isOpen,
    onClose,
    onSuccess,
}: AddReportModalProps) {
    const [formData, setFormData] = useState({
        crowdLevel: 'empty' as CrowdLevel,
        iceStatus: 'good' as IceStatus,
        rating: 0,
    });
    const [loading, setLoading] = useState(false);
    const [suggestedIceStatus, setSuggestedIceStatus] = useState<IceStatus | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Fetch weather-based ice status suggestion on open
    const fetchIceStatusSuggestion = async () => {
        if (latitude && longitude) {
            const result = await getIceStatusForLocation(latitude, longitude);
            if (result) {
                setSuggestedIceStatus(result.status);
                // Optional: auto-select? Let's just suggest for now to be less intrusive
                // setFormData(prev => ({ ...prev, iceStatus: result.status }));
            }
        }
    };

    // Handle photo selection
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Photo must be less than 5MB');
            return;
        }

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Photo must be JPG, PNG, or WEBP');
            return;
        }

        setPhotoFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please sign in to submit a report');
                return;
            }

            // Upload photo if provided
            let photoUrl: string | null = null;
            if (photoFile) {
                photoUrl = await uploadRinkPhoto(photoFile, user.id);
                if (!photoUrl) {
                    console.warn('Photo upload failed, continuing without photo');
                }
            }

            // Insert report
            const { error: reportError } = await supabase
                .from('reports')
                .insert({
                    rink_id: rinkId,
                    user_id: user.id,
                    crowd_level: formData.crowdLevel,
                    ice_status: formData.iceStatus,
                    rating: formData.rating > 0 ? formData.rating : null,
                    photo_url: photoUrl,
                    temperature: 0, // Will be updated by weather API or trigger
                    user_override: true, // Explicit user update
                });

            if (reportError) throw reportError;

            // Award points for submitting report
            await awardPoints(user.id, 'submit_report');

            // Award bonus points if photo was uploaded
            if (photoUrl) {
                await awardPoints(user.id, 'upload_photo');
            }

            // Play success sound
            playSound('goal-horn');

            // Reset form
            setFormData({
                crowdLevel: 'empty',
                iceStatus: 'good',
                rating: 0,
            });
            setPhotoFile(null);
            setPhotoPreview(null);

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-puck-black/80 flex items-center justify-center z-[60] p-4 font-sans">
            <div className="max-w-md w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-ice-white/10 bg-puck-black/90 backdrop-blur-xl text-ice-white p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl text-nes-shadow tracking-wider">UPDATE CONDITIONS</h2>
                        <p className="text-xs font-bold text-vegas-gold mt-1 pl-1">{rinkName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-ice-white hover:text-vegas-gold text-xl"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Crowd Level */}
                    <CrowdMeter
                        level={formData.crowdLevel}
                        onChange={(level) => setFormData({ ...formData, crowdLevel: level })}
                        interactive
                    />

                    {/* Ice Status */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-ice-white/80 tracking-wide">ICE STATUS</label>
                            <button
                                type="button"
                                onClick={fetchIceStatusSuggestion}
                                className="text-[10px] font-bold text-vegas-gold hover:underline"
                            >
                                CHECK WEATHER
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {(['frozen', 'good', 'slush', 'melted'] as IceStatus[]).map(status => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, iceStatus: status })}
                                    className={`
                    px-2 py-3 border rounded-lg text-[10px] font-bold transition-all relative shadow-sm uppercase tracking-wide
                    ${formData.iceStatus === status
                                            ? `bg-white/25 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm scale-105`
                                            : 'border-ice-white/30 bg-puck-black/50 hover:border-vegas-gold text-ice-white/60'
                                        }
                  `}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        {suggestedIceStatus && (
                            <p className="text-[8px] text-vegas-gold mt-2">
                                Weather suggests: {suggestedIceStatus.toUpperCase()}
                            </p>
                        )}
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-xs font-bold mb-2 text-ice-white/80 tracking-wider">RATE THIS RINK (OPTIONAL)</label>
                        <div className="flex gap-2 justify-center bg-puck-black/30 p-2 rounded-lg border-2 border-ice-white/10">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={`w-8 h-8 ${formData.rating >= star ? 'text-vegas-gold' : 'text-ice-white/20'}`}
                                        fill={formData.rating >= star ? '#B4975A' : 'none'}
                                        strokeWidth={1.5}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="block text-xs font-bold mb-2 text-ice-white/80 tracking-wide">ADD PHOTO (+5 BONUS POINTS)</label>
                        <div className="border-2 border-dashed border-ice-white/30 p-6 text-center rounded-xl hover:bg-puck-black/30 transition-colors">
                            {photoPreview ? (
                                <div className="relative">
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover border-4 border-ice-white image-smooth"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPhotoFile(null);
                                            setPhotoPreview(null);
                                        }}
                                        className="absolute top-2 right-2 bg-status-melted text-ice-white px-2 py-1 text-[8px] border-2 border-ice-white hover:bg-status-melted/80"
                                    >
                                        ✕ REMOVE
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer block">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                    <div className="text-ice-white/60 hover:text-vegas-gold transition-colors">
                                        <Camera className="w-8 h-8 mb-2 mx-auto" />
                                        <p className="text-[9px]">Click to upload photo</p>
                                        <p className="text-[7px] text-ice-white/40 mt-1">JPG, PNG, WEBP • Max 5MB</p>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-ice-white/10 hover:bg-ice-white/20 text-ice-white backdrop-blur-md border border-ice-white/20 shadow-lg shadow-ice-white/5 text-sm py-4 font-black rounded-xl uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? 'SUBMITTING...' : 'UPDATE CONDITIONS'}
                    </button>
                </form>
            </div >
        </div >
    );
}

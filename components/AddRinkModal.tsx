'use client';

import { useState, useEffect } from 'react';
import { supabase, IceStatus, CrowdLevel, RinkType, Rink } from '@/lib/supabase';
import { getIceStatusForLocation } from '@/lib/weather';
import { calculateDistance } from '@/lib/geo';
import { playSound } from '@/lib/sounds';
import { awardPoints } from '@/lib/scoring';
import { uploadRinkPhoto } from '@/lib/photos';
import { Upload, X, MapPin, Camera, Star, Check, Snowflake, Warehouse, Trees } from 'lucide-react';
import CrowdMeter from './CrowdMeter';

interface AddRinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialLocation?: { lat: number; lng: number };
    onPickLocation?: () => void;
}

export default function AddRinkModal({
    isOpen,
    onClose,
    onSuccess,
    initialLocation,
    onPickLocation,
}: AddRinkModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        country: '',
        rinkType: 'outdoor' as RinkType,
        crowdLevel: 'empty' as CrowdLevel,
        iceStatus: 'good' as IceStatus,
        rating: 0,
        latitude: initialLocation?.lat || 0,
        longitude: initialLocation?.lng || 0,
    });
    const [loading, setLoading] = useState(false);
    const [suggestedIceStatus, setSuggestedIceStatus] = useState<IceStatus | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Update coordinates when map location is picked
    useEffect(() => {
        if (initialLocation) {
            setFormData(prev => ({
                ...prev,
                latitude: initialLocation.lat,
                longitude: initialLocation.lng
            }));
        }
    }, [initialLocation]);

    // Fetch weather-based ice status suggestion
    const fetchIceStatusSuggestion = async () => {
        if (formData.latitude && formData.longitude) {
            const result = await getIceStatusForLocation(formData.latitude, formData.longitude);
            if (result) {
                setSuggestedIceStatus(result.status);
                setFormData(prev => ({ ...prev, iceStatus: result.status }));
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
                alert('Please sign in to add a rink');
                return;
            }

            if (!formData.address && formData.latitude === 0) {
                alert('Please provide an Address or PIN the location on the map.');
                setLoading(false);
                return;
            }

            // Proximity Check: Prevent duplicate rinks within 100 meters
            if (formData.latitude !== 0 && formData.longitude !== 0) {
                const { data: existingRinks } = await supabase
                    .from('rinks')
                    .select('latitude, longitude, name');

                if (existingRinks) {
                    const tooClose = existingRinks.find(r =>
                        calculateDistance(formData.latitude, formData.longitude, r.latitude, r.longitude) < 100
                    );

                    if (tooClose) {
                        alert(`A rink already exists here: "${tooClose.name}". Please check the map!`);
                        setLoading(false);
                        return;
                    }
                }
            }

            // Insert rink
            const { data: rink, error: rinkError } = await supabase
                .from('rinks')
                .insert({
                    name: formData.name,
                    address: formData.address,
                    city: formData.city,
                    country: formData.country,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    rink_type: formData.rinkType,
                    created_by: user.id,
                })
                .select()
                .single();

            if (rinkError) throw rinkError;

            // Upload photo if provided
            let photoUrl: string | null = null;
            if (photoFile) {
                photoUrl = await uploadRinkPhoto(photoFile, user.id);
                if (!photoUrl) {
                    console.warn('Photo upload failed, continuing without photo');
                }
            }

            // Insert initial report
            const { error: reportError } = await supabase
                .from('reports')
                .insert({
                    rink_id: rink.id,
                    user_id: user.id,
                    crowd_level: formData.crowdLevel,
                    ice_status: formData.iceStatus,
                    rating: formData.rating > 0 ? formData.rating : null,
                    photo_url: photoUrl,
                    temperature: 0, // Will be updated by weather API
                    user_override: false,
                });

            if (reportError) throw reportError;

            // Award points for adding rink and submitting report
            await awardPoints(user.id, 'add_rink');
            await awardPoints(user.id, 'submit_report');

            // Award bonus points if photo was uploaded
            if (photoUrl) {
                await awardPoints(user.id, 'upload_photo');
            }

            // Play success sound
            playSound('goal-horn');

            // Reset form and close
            setFormData({
                name: '',
                address: '',
                city: '',
                country: '',
                rinkType: 'outdoor',
                crowdLevel: 'empty',
                iceStatus: 'good',
                rating: 0,
                latitude: 0,
                longitude: 0,
            });
            setPhotoFile(null);
            setPhotoPreview(null);

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error adding rink:', error);
            alert('Failed to add rink. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-puck-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-puck-black/90 backdrop-blur-xl border border-ice-white/10 rounded-3xl shadow-2xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black italic tracking-tighter text-ice-white uppercase">ADD NEW <span className="text-vegas-gold">RINK</span></h2>
                    <button
                        onClick={onClose}
                        className="text-ice-white/60 hover:text-vegas-gold transition-colors p-2 hover:bg-ice-white/5 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Rink Name */}
                    <div>
                        <label className="block text-xs font-bold mb-2 text-ice-white/60 tracking-wider">RINK NAME</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-ice-white/5 border border-ice-white/10 rounded-xl text-ice-white text-sm focus:border-vegas-gold/50 focus:bg-ice-white/10 outline-none transition-all placeholder-ice-white/20"
                            placeholder="e.g. Parc La Fontaine"
                        />
                    </div>

                    {/* Address with Map Pin */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-ice-white/60 tracking-wider">ADDRESS</label>
                            <button
                                type="button"
                                onClick={onPickLocation}
                                className="text-[10px] bg-vegas-gold/10 hover:bg-vegas-gold/20 text-vegas-gold px-3 py-1 rounded-full flex items-center gap-1 transition-colors font-bold"
                            >
                                <MapPin className="w-3 h-3" /> PIN ON MAP
                            </button>
                        </div>
                        {formData.latitude !== 0 && (
                            <p className="text-[10px] text-emerald-400 mb-2 flex items-center gap-1 font-bold">
                                <Check className="w-3 h-3" /> Location set: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                            </p>
                        )}
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-4 py-3 bg-ice-white/5 border border-ice-white/10 rounded-xl text-ice-white text-sm focus:border-vegas-gold/50 focus:bg-ice-white/10 outline-none transition-all placeholder-ice-white/20"
                            placeholder={formData.latitude !== 0 ? "Location set via map (Optional)" : "123 Hockey St"}
                        />
                    </div>

                    {/* City & Country */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-2 text-ice-white/60 tracking-wider">CITY</label>
                            <input
                                type="text"
                                required
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-4 py-3 bg-ice-white/5 border border-ice-white/10 rounded-xl text-ice-white text-sm focus:border-vegas-gold/50 focus:bg-ice-white/10 outline-none transition-all placeholder-ice-white/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 text-ice-white/60 tracking-wider">COUNTRY</label>
                            <input
                                type="text"
                                required
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-4 py-3 bg-ice-white/5 border border-ice-white/10 rounded-xl text-ice-white text-sm focus:border-vegas-gold/50 focus:bg-ice-white/10 outline-none transition-all placeholder-ice-white/20"
                            />
                        </div>
                    </div>

                    {/* Rink Type */}
                    <div>
                        <label className="block text-xs font-bold mb-2 text-ice-white/60 tracking-wider">RINK TYPE</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, rinkType: 'outdoor' })}
                                className={`flex-1 px-2 py-4 text-xs font-bold rounded-xl transition-all relative uppercase tracking-wider flex flex-col items-center gap-2 ${formData.rinkType === 'outdoor' ? 'bg-white/25 border border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm scale-105' : 'bg-ice-white/5 border border-ice-white/10 text-ice-white/60 hover:bg-ice-white/10 hover:border-ice-white/30 hover:text-ice-white'}`}
                            >
                                <Snowflake className="w-5 h-5" />
                                OUTDOOR
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, rinkType: 'indoor' })}
                                className={`flex-1 px-2 py-4 text-xs font-bold rounded-xl transition-all relative uppercase tracking-wider flex flex-col items-center gap-2 ${formData.rinkType === 'indoor' ? 'bg-white/25 border border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm scale-105' : 'bg-ice-white/5 border border-ice-white/10 text-ice-white/60 hover:bg-ice-white/10 hover:border-ice-white/30 hover:text-ice-white'}`}
                            >
                                <Warehouse className="w-5 h-5" />
                                INDOOR
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, rinkType: 'pond' })}
                                className={`flex-1 px-2 py-4 text-xs font-bold rounded-xl transition-all relative uppercase tracking-wider flex flex-col items-center gap-2 ${formData.rinkType === 'pond' ? 'bg-white/25 border border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm scale-105' : 'bg-ice-white/5 border border-ice-white/10 text-ice-white/60 hover:bg-ice-white/10 hover:border-ice-white/30 hover:text-ice-white'}`}
                            >
                                <Trees className="w-5 h-5" />
                                POND
                            </button>
                        </div>
                    </div>

                    {/* Crowd Level */}
                    <CrowdMeter
                        level={formData.crowdLevel}
                        onChange={(level) => setFormData({ ...formData, crowdLevel: level })}
                        interactive
                    />

                    {/* Ice Status */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-ice-white/60 tracking-wider">ICE STATUS</label>
                            <button
                                type="button"
                                onClick={fetchIceStatusSuggestion}
                                className="text-[9px] text-vegas-gold hover:text-vegas-gold/80 bg-vegas-gold/10 px-2 py-1 rounded-lg transition-colors font-bold"
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
                    px-2 py-3 rounded-xl text-[10px] md:text-xs font-bold transition-all uppercase tracking-wide
                    ${formData.iceStatus === status
                                            ? `bg-white/25 border border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm scale-105`
                                            : 'bg-ice-white/5 border border-ice-white/10 text-ice-white/60 hover:bg-ice-white/10 hover:border-ice-white/30 hover:text-ice-white'
                                        }
                  `}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-xs font-bold mb-2 text-ice-white/60 tracking-wider">RATE THIS RINK (OPTIONAL)</label>
                        <div className="flex gap-2 justify-center bg-ice-white/5 p-3 rounded-xl border border-ice-white/10">
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
                        {formData.rating > 0 && (
                            <p className="text-center text-[10px] text-vegas-gold mt-2 font-bold tracking-wider">
                                {formData.rating}/5 STARS
                            </p>
                        )}
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="block text-xs font-bold mb-2 text-ice-white/60 tracking-wider">ADD PHOTO (+5 BONUS POINTS)</label>
                        <div className="border border-dashed border-ice-white/20 hover:border-vegas-gold/50 bg-ice-white/5 rounded-2xl p-6 text-center transition-colors group">
                            {photoPreview ? (
                                <div className="relative rounded-xl overflow-hidden shadow-lg">
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPhotoFile(null);
                                            setPhotoPreview(null);
                                        }}
                                        className="absolute top-2 right-2 bg-puck-black/80 backdrop-blur text-ice-white p-2 rounded-full hover:bg-status-melted transition-colors"
                                    >
                                        <X className="w-4 h-4" />
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
                                    <div className="text-ice-white/40 group-hover:text-vegas-gold transition-colors flex flex-col items-center gap-2">
                                        <div className="p-3 bg-ice-white/10 rounded-full group-hover:bg-vegas-gold/20 transition-colors">
                                            <Camera className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Click to upload photo</p>
                                            <p className="text-[10px] opacity-60 mt-1">JPG, PNG, WEBP • Max 5MB</p>
                                        </div>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 text-emerald-500 py-3 font-black text-lg rounded-xl shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        {loading ? 'ADDING...' : <><MapPin className="w-5 h-5" /> ADD RINK</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ArrowRight, MapPin, Trophy, Users, Check } from 'lucide-react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email) {
      setLoading(true);
      try {
        const { error: insertError } = await supabase
          .from('subscribers')
          .insert([{ email }]);

        if (insertError) {
          if (insertError.code === '23505') { // Unique violation
            setSubscribed(true); // Treat as success for UX
          } else {
            throw insertError;
          }
        } else {
          setSubscribed(true);
        }

        setTimeout(() => setSubscribed(false), 3000);
        setEmail('');
      } catch (err) {
        console.error('Subscription error:', err);
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-rink-blue text-ice-white font-sans selection:bg-vegas-gold selection:text-puck-black overflow-x-hidden">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-puck-black/80 backdrop-blur-md border-b border-ice-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter flex items-center">
              <span className="text-ice-white">RINK</span><span className="text-[#A5F2F3]">SPOT</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowInstallModal(true)}
              className="text-xs font-bold uppercase tracking-widest text-ice-white/60 hover:text-white transition-colors hidden md:block"
            >
              Get the App
            </button>
            <Link
              href="/map"
              className="bg-white text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-wider hover:bg-[#B4975A] hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-vegas-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#A5F2F3]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ice-white/5 border border-ice-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-ice-white/80">Global Rink Database Live</span>
          </div>

          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-8 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Find Your <br />
            <span className="text-vegas-gold">RINK</span>
          </h2>

          <p className="text-lg md:text-xl text-ice-white/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            The world's largest crowdsourced directory of outdoor rinks, ponds, and ODRs. Join the community, track your stats, and always know the ice conditions.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link
              href="/map"
              className="w-full md:w-auto px-8 py-4 bg-white hover:bg-[#B4975A] text-black rounded-xl font-black uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
            >
              Start Exploring <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="w-full md:w-auto relative group">
              <input
                type="email"
                placeholder="Join the newsletter"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full md:w-80 px-6 py-4 bg-ice-white/5 border border-ice-white/10 rounded-xl text-ice-white placeholder:text-ice-white/30 focus:outline-hidden focus:border-vegas-gold/50 transition-all font-medium"
              />
              <button
                onClick={handleSubscribe}
                className="absolute right-2 top-2 bottom-2 px-4 bg-ice-white/10 hover:bg-ice-white/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors text-vegas-gold"
              >
                {subscribed ? <Check className="w-4 h-4" /> : 'Join'}
              </button>
            </div>
          </div>

          {/* Stats / Social Proof - Updated to be more realistic */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-ice-white/10 pt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-1">500+</div>
              <div className="text-[10px] font-bold text-ice-white/40 uppercase tracking-widest">Global Rinks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-1">Growing</div>
              <div className="text-[10px] font-bold text-ice-white/40 uppercase tracking-widest">Community</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-1">10+</div>
              <div className="text-[10px] font-bold text-ice-white/40 uppercase tracking-widest">Unique Badges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-1">5.0/5</div>
              <div className="text-[10px] font-bold text-ice-white/40 uppercase tracking-widest">App Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-puck-black/30 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="bg-ice-white/5 border border-ice-white/10 p-8 rounded-3xl hover:bg-ice-white/10 transition-all group">
            <div className="w-12 h-12 bg-vegas-gold/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6 text-vegas-gold" />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-3">Crowdsourced Map</h3>
            <p className="text-ice-white/60 leading-relaxed">Discover hidden gems in your neighborhood or add new locations to help the community grow.</p>
          </div>

          <div className="bg-ice-white/5 border border-ice-white/10 p-8 rounded-3xl hover:bg-ice-white/10 transition-all group">
            <div className="w-12 h-12 bg-[#A5F2F3]/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-[#A5F2F3]" />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-3">Earn Recognition</h3>
            <p className="text-ice-white/60 leading-relaxed">Check in at rinks, upload photos, and earn unique badges to show off in your locker room.</p>
          </div>

          <div className="bg-ice-white/5 border border-ice-white/10 p-8 rounded-3xl hover:bg-ice-white/10 transition-all group">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-3">Community First</h3>
            <p className="text-ice-white/60 leading-relaxed">Connect with local skaters, update ice conditions, and keep the outdoor rink tradition alive.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-ice-white/10 bg-puck-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black italic uppercase tracking-tighter flex items-center">
              <span className="text-ice-white">RINK</span><span className="text-[#A5F2F3]">SPOT</span>
            </h1>
          </div>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-ice-white/40">
            <Link href="/terms" className="hover:text-vegas-gold transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-vegas-gold transition-colors">Privacy</Link>
            <Link href="mailto:doyon.sebastien@hotmail.com" className="hover:text-vegas-gold transition-colors">Contact</Link>
          </div>
          <div className="text-[10px] font-bold text-ice-white/20 uppercase tracking-widest">
            © {new Date().getFullYear()} RinkSpot. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-puck-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowInstallModal(false)}>
          <div className="bg-[#111] border border-ice-white/10 p-8 rounded-3xl max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 text-ice-white/40 hover:text-white transition-colors">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">✕</div>
            </button>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-black italic uppercase text-white mb-2">Install RinkSpot</h3>
              <p className="text-ice-white/60 text-sm">Add to your home screen for the full app experience.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-ice-white/5 p-4 rounded-xl border border-ice-white/5">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  🍎 iOS (Safari)
                </h4>
                <ol className="text-xs text-ice-white/60 space-y-2 list-decimal list-inside font-medium">
                  <li>Tap the <span className="text-vegas-gold">Share</span> button in the menu bar.</li>
                  <li>Scroll down and select <span className="text-vegas-gold">Add to Home Screen</span>.</li>
                  <li>Tap <span className="text-white">Add</span> in the top right.</li>
                </ol>
              </div>

              <div className="bg-ice-white/5 p-4 rounded-xl border border-ice-white/5">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  🤖 Android (Chrome)
                </h4>
                <ol className="text-xs text-ice-white/60 space-y-2 list-decimal list-inside font-medium">
                  <li>Tap the <span className="text-vegas-gold">Three Dots</span> menu.</li>
                  <li>Select <span className="text-vegas-gold">Install App</span> or <span className="text-vegas-gold">Add to Home Screen</span>.</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full mt-8 py-3 bg-vegas-gold text-black font-black uppercase tracking-wider rounded-xl hover:bg-[#C5A86B] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

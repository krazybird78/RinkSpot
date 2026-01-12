export default function TermsOfService() {
    return (
        <main className="min-h-screen bg-rink-blue text-ice-white font-sans selection:bg-vegas-gold selection:text-puck-black">
            <div className="max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-8 text-vegas-gold">
                    Terms of Service
                </h1>
                <div className="space-y-6 text-ice-white/80 leading-relaxed">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-2xl font-bold text-ice-white mb-4 uppercase tracking-wide">1. Acceptance of Terms</h2>
                        <p>By accessing or using RinkSpot, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-ice-white mb-4 uppercase tracking-wide">2. Use License</h2>
                        <p>Permission is granted to temporarily download one copy of the materials (information or software) on RinkSpot's website for personal, non-commercial transitory viewing only.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-ice-white mb-4 uppercase tracking-wide">3. User Conduct</h2>
                        <p>You agree not to use the service to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Submit false or misleading information about rinks</li>
                            <li>Harass, abuse, or harm another person</li>
                            <li>Violate any applicable laws or regulations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-ice-white mb-4 uppercase tracking-wide">4. Disclaimer</h2>
                        <p>The materials on RinkSpot's website are provided on an 'as is' basis. RinkSpot makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                    </section>
                </div>

                <div className="mt-12 pt-12 border-t border-ice-white/10">
                    <a href="/" className="text-vegas-gold hover:text-white font-bold uppercase tracking-wider transition-colors">← Back to Home</a>
                </div>
            </div>
        </main>
    );
}

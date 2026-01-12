export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-rink-blue text-ice-white font-sans selection:bg-vegas-gold selection:text-puck-black">
            <div className="max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-8 text-vegas-gold">
                    Privacy Policy
                </h1>
                <div className="space-y-6 text-ice-white/80 leading-relaxed">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-2xl font-bold text-ice-white mb-4 uppercase tracking-wide">1. Information We Collect</h2>
                        <p className="mb-4">We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or report a rink.</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Account information (email, username)</li>
                            <li>Location data (when adding rinks or finding nearby locations)</li>
                            <li>Communications you send to us</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-ice-white mb-4 uppercase tracking-wide">2. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process transactions and send related information</li>
                            <li>Send you technical notices, updates, and support messages</li>
                            <li>Respond to your comments and questions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-ice-white mb-4 uppercase tracking-wide">3. Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy, please contact us at support@rinkspot.com</p>
                    </section>
                </div>

                <div className="mt-12 pt-12 border-t border-ice-white/10">
                    <a href="/" className="text-vegas-gold hover:text-white font-bold uppercase tracking-wider transition-colors">← Back to Home</a>
                </div>
            </div>
        </main>
    );
}

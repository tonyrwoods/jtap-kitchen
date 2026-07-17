import { useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Home, UtensilsCrossed, Calendar, Gift } from 'lucide-react';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });

    const QUICK_LINKS = [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Menu', href: '/menu', icon: UtensilsCrossed },
        { label: 'Events', href: '/events', icon: Calendar },
        { label: 'Gift Cards', href: '/gift-cards', icon: Gift },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-lg w-full">
                <div className="text-center space-y-6">
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1 className="font-heading text-8xl font-bold text-primary/30">404</h1>
                        <div className="h-0.5 w-16 bg-primary mx-auto rounded-full" />
                    </div>

                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="font-heading text-3xl font-semibold text-foreground">
                            Page Not Found
                        </h2>
                        <p className="font-body text-muted-foreground leading-relaxed">
                            The page <span className="font-medium text-foreground">"{pageName}"</span> could not be found.
                            It may have moved or no longer exists.
                        </p>
                    </div>

                    {/* Admin Note */}
                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                </div>
                                <div className="text-left space-y-1">
                                    <p className="font-body text-sm font-semibold text-foreground">Admin Note</p>
                                    <p className="font-body text-sm text-muted-foreground leading-relaxed">
                                        This page hasn't been implemented yet. Ask in the chat to build it.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
                            <Link
                                key={href}
                                to={href}
                                className="flex items-center gap-2 px-4 py-3 font-body text-sm font-medium text-foreground bg-card border border-border rounded-xl hover:bg-secondary hover:border-primary/30 transition-all duration-200"
                            >
                                <Icon className="w-4 h-4 text-primary" />
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Primary CTA */}
                    <div className="pt-4">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20"
                        >
                            <Home className="w-4 h-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
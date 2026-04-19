import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PlaidLinkButton({ onSuccess, className = '' }) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);
  const [plaidLoaded, setPlaidLoaded] = useState(false);

  // Load Plaid Link script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v3/stable/link-initialize.js';
    script.async = true;
    script.onload = () => setPlaidLoaded(true);
    document.body.appendChild(script);
  }, []);

  const handleClick = async () => {
    if (linked) return;
    setLoading(true);

    try {
      // Get link token
      const response = await base44.functions.invoke('createPlaidLinkToken', {});
      const { link_token } = response.data;

      if (!link_token) {
        toast.error('Failed to initialize Plaid Link');
        setLoading(false);
        return;
      }

      setLinkToken(link_token);

      // Initialize Plaid Link
      if (window.Plaid) {
        const handler = window.Plaid.create({
          token: link_token,
          onSuccess: async (publicToken) => {
            try {
              await base44.functions.invoke('exchangePlaidToken', { publicToken });
              setLinked(true);
              toast.success('Bank account linked successfully');
              if (onSuccess) onSuccess();
            } catch (error) {
              toast.error('Failed to link account');
            }
          },
          onExit: (err) => {
            if (err) {
              toast.error(err.error_message || 'Plaid Link closed');
            }
          },
        });

        handler.open();
      }
    } catch (error) {
      toast.error('Failed to initialize Plaid');
    } finally {
      setLoading(false);
    }
  };

  if (linked) {
    return (
      <div className={`flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <span className="font-body text-sm font-medium text-green-700">Bank account linked</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || !plaidLoaded}
      className={`flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        '🏦 Link Bank Account'
      )}
    </button>
  );
}
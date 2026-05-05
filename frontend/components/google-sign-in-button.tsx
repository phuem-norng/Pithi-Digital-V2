'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
          }) => void) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => Promise<void>;
  disabled?: boolean;
  text?: string;
}

export function GoogleSignInButton({
  onCredential,
  disabled = false,
  text = 'Continue with Google',
}: GoogleSignInButtonProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.google) {
        setIsScriptLoaded(true);
      } else {
        existingScript.addEventListener('load', () => setIsScriptLoaded(true));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  const handleGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      alert('Google login is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
      return;
    }

    if (!window.google || !isScriptLoaded) {
      alert('Google library is still loading. Please try again.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      use_fedcm_for_prompt: false,
      callback: async (response) => {
        setIsSubmitting(true);
        try {
          await onCredential(response.credential);
        } finally {
          setIsSubmitting(false);
        }
      },
    });

    window.google.accounts.id.prompt((notification) => {
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment() ||
        notification.isDismissedMoment()
      ) {
        // FedCM was dismissed or not shown — not an error, safe to ignore
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled || !isScriptLoaded || isSubmitting}
      onClick={handleGoogleSignIn}
    >
      {isSubmitting ? 'Processing Google sign in...' : text}
    </Button>
  );
}

import { useEffect } from 'react';
import { Box, Text } from '@mantine/core';

const AD_CLIENT = 'ca-pub-3330710888188184';

export const AD_SLOTS = {
  HOME_BANNER: '4988621227',
  GAME_BANNER_TOP: '5571804104',
  GAME_BANNER_BOTTOM: '1712450148',
} as const;

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

type AdBannerProps = {
  /** AdSense ad unit slot ID (data-ad-slot). Get this from your AdSense account. */
  slot: string;
  /** Ad format: auto, fluid, rectangle, horizontal, etc. Defaults to auto for responsive. */
  format?: string;
  /** Whether ad should be full-width responsive. Defaults to true. */
  responsive?: boolean;
  /** Optional outer container style */
  style?: React.CSSProperties;
  /** Test mode: show placeholder when slot is placeholder ID. Defaults to true in development. */
  showPlaceholder?: boolean;
};

export function AdBanner({
  slot,
  format = 'auto',
  responsive = true,
  style,
  showPlaceholder = true,
}: AdBannerProps) {
  const isPlaceholder = slot.startsWith('123456789');

  useEffect(() => {
    // Only push to adsbygoogle if we have a real slot and window is available
    if (isPlaceholder) return;
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [slot, isPlaceholder]);

  // In development or with placeholder slots, show a visual placeholder
  // so layout can be verified without needing real AdSense approval.
  // In production with placeholder slots, render nothing to avoid AdSense errors.
  if (isPlaceholder) {
    if (!showPlaceholder) return null;
    // Only show placeholder in dev or when explicitly requested
    const isDev = import.meta.env.DEV;
    if (!isDev) {
      // In production with placeholder IDs, don't attempt to load ads.
      // Auto ads (enabled by the script tag) will still work site-wide.
      return null;
    }
    return (
      <Box
        my="md"
        p="md"
        style={{
          minHeight: 90,
          border: '1px dashed var(--mantine-color-gray-4)',
          borderRadius: 'var(--mantine-radius-md)',
          backgroundColor: 'var(--mantine-color-gray-0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          ...style,
        }}
      >
        <Text size="xs" c="dimmed">
          AdSense placeholder — slot {slot} ({format})
          <br />
          Replace AD_SLOTS in src/AdSense.tsx with real IDs
        </Text>
      </Box>
    );
  }

  return (
    <Box
      my="md"
      style={{
        minHeight: 90,
        overflow: 'hidden',
        textAlign: 'center',
        ...style,
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </Box>
  );
}

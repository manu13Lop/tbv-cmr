'use client';

import { useMemo } from 'react';

export function YoutubeEmbed({ url }: { url: string }) {
  const videoId = useMemo(() => extractYoutubeId(url), [url]);

  if (!videoId) return null;

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="border-border relative aspect-video w-full overflow-hidden rounded-lg border">
      <iframe
        src={embedUrl}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="size-full border-0"
      />
    </div>
  );
}

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') || null;
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null;
    }
    return null;
  } catch {
    return null;
  }
}

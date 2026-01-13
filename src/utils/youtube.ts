export function extractVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    // Standard watch URL
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([a-zA-Z0-9_-]{11})/,
    // Short URL
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URL
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Shorts URL
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // Live URL
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Check if it's just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

export function getVideoThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

export function getEmbedUrl(videoId: string, playlistId?: string | null): string {
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    modestbranding: '1',
  });

  if (playlistId) {
    params.set('listType', 'playlist');
    params.set('list', playlistId);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function isValidYoutubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

export function generateVideoTitle(videoId: string): string {
  return `Video ${videoId.slice(0, 6)}...`;
}

export function extractPlaylistId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

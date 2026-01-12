import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Copy, ListEnd, Play, Plus, X, Check, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getVideoThumbnail, extractVideoId, extractPlaylistId } from '@/utils/youtube';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { Video } from '@/types';

// Add global type for YouTube Iframe API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    // Add missing property to window
    onYouTubePlayerReady?: (event: any) => void;
  }
}

export interface YouTubePlayerHandle {
  playVideo: (videoId: string) => void;
  getPlaylistIndex: () => number;
  getPlaylistId: () => string | null;
}

interface YouTubePlayerProps {
  videoId: string;
  playlistId?: string | null;
  onVideoEnd?: () => void;
  onOpenQueue?: () => void;
  onAddToQueue?: (video: Video) => void;
  queueCount?: number;
  t?: (key: string) => string;
  onVideoPlay?: (videoId: string) => void;
  onColorChange?: (color: string) => void;
  onDirectPlay?: (url: string) => void;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(({
  videoId,
  playlistId,
  onVideoEnd,
  onOpenQueue,
  onAddToQueue,
  queueCount = 0,
  t = (key) => key,
  onVideoPlay,
  onColorChange,
  onDirectPlay,
  isTheaterMode,
  onToggleTheater,
}, ref) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    playVideo: (newVideoId: string) => {
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(newVideoId);
        // Optimistically update internal state to prevent "flash" of old ID
        setCurrentVideoId(newVideoId);
      }
    },
    getPlaylistIndex: () => {
      return playerRef.current?.getPlaylistIndex() ?? -1;
    },
    getPlaylistId: () => {
      return playerRef.current?.getPlaylistId() ?? null;
    }
  }));

  // State to track the ACTUAL playing video (syncs with internal  /* State */
  const [currentVideoId, setCurrentVideoId] = useState<string>(videoId || '');
  const [isPlaying, setIsPlaying] = useState(false);

  const [dominantColor, setDominantColor] = useState<string>('');
  const [showAddInput, setShowAddInput] = useState(false); // For Queue
  const [urlInput, setUrlInput] = useState('');

  const [showDirectPlayInput, setShowDirectPlayInput] = useState(false); // For Direct Play
  const [directPlayUrl, setDirectPlayUrl] = useState('');

  // Track previous playlist to detect changes
  const prevPlaylistId = useRef<string | null | undefined>(playlistId);

  // Sync currentVideoId with prop when prop changes (external navigation)
  useEffect(() => {
    if (videoId !== currentVideoId) {
      setCurrentVideoId(videoId);
    }
  }, [videoId, currentVideoId]);

  // Preemptive Queue Interceptor:
  // If we let the video reach natural "END", the YouTube Playlist logic often fires before our React state can intercept.
  // Solution: We poll near the end and "High Over" (Hijack) manually just before it finishes.
  useEffect(() => {
    if (!isPlaying || queueCount === 0) return;

    const intervalId = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();

        // If within 0.3s of end (and valid duration)
        if (duration > 0 && (duration - currentTime) < 0.3) {
          // 1. Force Pause to stop Playlist Auto-advance
          playerRef.current.pauseVideo();
          clearInterval(intervalId);

          // 2. Manually trigger our End logic
          // We use a timeout to break the stack and ensure pause takes effect
          setTimeout(() => {
            onVideoEnd();
          }, 0);
        }
      }
    }, 100); // Check every 100ms

    return () => clearInterval(intervalId);
  }, [isPlaying, queueCount, onVideoEnd]);


  // Track props with refs to access fresh values inside closures (event handlers)
  const onVideoEndRef = useRef(onVideoEnd);
  const onVideoPlayRef = useRef(onVideoPlay);

  useEffect(() => {
    onVideoEndRef.current = onVideoEnd;
    onVideoPlayRef.current = onVideoPlay;
  }, [onVideoEnd, onVideoPlay]);

  // Initialize YouTube Player ONCE
  useEffect(() => {
    // Load YouTube IFrame Player API code asynchronously
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!containerRef.current) return;

      // Clean up previous instance if exists
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) { }
      }

      const playerOptions: any = {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          // listType: playlistId ? 'playlist' : undefined, // Removed per request
          list: playlistId || undefined,
        },
        events: {
          onReady: (event: any) => {
            // ...
          },
          onStateChange: (event: any) => {
            // Sync internal state
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);

            if (event.data === window.YT.PlayerState.ENDED) {
              // Verify we haven't already moved on (race condition check)
              if (onVideoEndRef.current) onVideoEndRef.current();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              // If the player starts playing a NEW video ID automatically (playlist auto-advance)
              // We need to notify the parent to update URL/History
              const playerVideoId = event.target.getVideoData().video_id;
              // Use a ref or just call the prop if stable
              if (onVideoPlayRef.current) {
                onVideoPlayRef.current(playerVideoId);
              }
            }
          },
        }
      };

      playerRef.current = new window.YT.Player(containerRef.current, playerOptions);
    };

    // This function will be called by the YouTube IFrame API once it's ready
    window.onYouTubeIframeAPIReady = () => {
      try {
        initPlayer();
      } catch (e) { console.error(e); }
    };

    // If API is already loaded (e.g., hot reload), call initPlayer directly
    if (window.YT && window.YT.Player) {
      try {
        initPlayer();
      } catch (e) { console.error(e); }
    }

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) { console.error(e); }
      }
    };
  }, []); // Only initialize once

  // When videoId/playlistId changes externally, handle transitions intelligently
  useEffect(() => {
    if (playerRef.current) {
      const playlistChanged = playlistId !== prevPlaylistId.current;
      prevPlaylistId.current = playlistId;

      if (playlistChanged && playlistId) {
        // Case 1: New Playlist Loaded -> Load Playlist
        playerRef.current.loadPlaylist({
          list: playlistId,
        });
      } else if (videoId !== currentVideoId) {
        // Case 2: Same Playlist Context
        // PROBLEM: loadVideoById() often strips the playlist UI/Context.
        // SOLUTION: Try to find the video's index in the CURRENT playlist and jump to it.

        // We only attempt this if we have a playlist active
        let handled = false;

        if (playlistId && typeof playerRef.current.getPlaylist === 'function') {
          try {
            const currentIds = playerRef.current.getPlaylist();
            if (Array.isArray(currentIds)) {
              const index = currentIds.indexOf(videoId);
              if (index !== -1 && typeof playerRef.current.playVideoAt === 'function') {
                // Found it! Use playlist navigation to keep UI intact
                playerRef.current.playVideoAt(index);
                handled = true;
              }
            }
          } catch (e) { }
        }

        // Fallback: If not in list (or list check failed), load directly
        if (!handled && playerRef.current.loadVideoById) {
          playerRef.current.loadVideoById(videoId);
        }
      }
    }
  }, [videoId, playlistId, currentVideoId]);

  // Extract dominant color from thumbnail
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = getVideoThumbnail(currentVideoId, 'maxres'); // Use currentVideoId

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Sample colors
        const regions = [
          { x: 0, y: 0, w: canvas.width / 3, h: canvas.height / 3 },
          { x: canvas.width / 3, y: 0, w: canvas.width / 3, h: canvas.height / 3 },
          { x: canvas.width * 2 / 3, y: 0, w: canvas.width / 3, h: canvas.height / 3 },
        ];

        let totalR = 0, totalG = 0, totalB = 0, sampleCount = 0;

        regions.forEach(region => {
          const imageData = ctx.getImageData(region.x, region.y, region.w, region.h);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 16) {
            totalR += data[i];
            totalG += data[i + 1];
            totalB += data[i + 2];
            sampleCount++;
          }
        });

        const avgR = Math.round(totalR / sampleCount);
        const avgG = Math.round(totalG / sampleCount);
        const avgB = Math.round(totalB / sampleCount);

        const newColor = `${avgR}, ${avgG}, ${avgB}`;
        setDominantColor(newColor);
        onColorChange?.(newColor);
      } catch (e) {
        setDominantColor('239, 68, 68');
        onColorChange?.('239, 68, 68');
      }
    };

    img.onerror = () => {
      setDominantColor('239, 68, 68');
      onColorChange?.('239, 68, 68');
    };
  }, [currentVideoId]); // Update glow when currentVideoId changes

  const handleCopyUrl = () => {
    // Copy the CURRENT video ID, not the prop ID
    navigator.clipboard.writeText(`https://youtube.com/watch?v=${currentVideoId}`);
  };

  const handleAddToQueue = () => {
    if (!urlInput.trim()) return;

    const extractedId = extractVideoId(urlInput);
    if (!extractedId) return;

    const video: Video = {
      id: extractedId,
      thumbnail: getVideoThumbnail(extractedId),
      url: urlInput.trim(),
      playlistId: extractPlaylistId(urlInput) || undefined,
      addedAt: Date.now(),
    };

    onAddToQueue?.(video);
    setUrlInput('');
    setShowAddInput(false);
  };

  return (
    <div className="relative w-full">
      {/* Video Container with dynamic glow in dark mode */}
      <div
        className={cn(
          "relative w-full rounded-xl",
          "transition-all duration-700 ease-in-out"
        )}
        style={{
          boxShadow: dominantColor
            ? `0 0 120px -20px rgba(${dominantColor}, 0.5), 
               0 0 60px -10px rgba(${dominantColor}, 0.3),
               0 0 20px -5px rgba(${dominantColor}, 0.4)`
            : '0 0 40px -10px rgba(0,0,0,0.1)'
        }}
      >
        {/* Deep Ambient Background Layer */}
        <div
          className="absolute -inset-[10%] rounded-[30px] blur-[60px] opacity-40 dark:opacity-60 transition-all duration-1000 pointer-events-none -z-10"
          style={{
            background: dominantColor
              ? `conic-gradient(from 0deg at 50% 50%, 
                  rgba(${dominantColor}, 0.2) 0deg, 
                  rgba(${dominantColor}, 0.5) 180deg, 
                  rgba(${dominantColor}, 0.2) 360deg)`
              : undefined,
            transform: 'scale(0.95)',
          }}
        />

        <div className="relative aspect-video w-full bg-foreground/5 rounded-xl overflow-hidden">
          {/* This div will be replaced by the YouTube IFrame API */}
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      {/* Compact URL bar */}
      <div className="mt-6 flex items-center gap-2">
        {/* Thumbnail + Copy */}
        <div className="flex items-center gap-2 pr-2 pl-1.5 h-10 rounded-xl bg-card/80 backdrop-blur-xl border border-border/50">
          <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={getVideoThumbnail(currentVideoId, 'default')}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              handleCopyUrl();
              toast({
                className: "rounded-full bg-white/95 dark:bg-zinc-950/90 border border-zinc-200 dark:border-white/10 backdrop-blur-md shadow-2xl px-6 py-3 flex items-center justify-center min-w-[200px] w-auto mx-auto transform hover:scale-105 transition-all duration-300 group",
                style: {
                  // Light Mode: Standard Shadow
                  // Dark Mode: Dynamic Neon Glow based on video color
                  '--toast-shadow': dominantColor ? `0 0 30px -5px rgba(${dominantColor}, 0.5)` : '0 0 30px -5px rgba(255,255,255,0.1)',
                } as React.CSSProperties,
                description: (
                  <div className="flex items-center gap-4">
                    <div
                      className="p-1.5 rounded-full flex-shrink-0 transition-colors bg-zinc-100 dark:bg-white/10"
                    >
                      <Check className="w-5 h-5 text-zinc-900 dark:text-white stroke-[2.5px]" />
                    </div>
                    <div className="flex flex-col mr-2">
                      <span className="font-bold text-base text-zinc-900 dark:text-white leading-none tracking-wide">{t('copied') || 'Copied'}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-white/60 font-medium mt-1 uppercase tracking-wider">Ready to share</span>
                    </div>

                    {/* Style injection for Dark Mode Glow */}
                    <style>
                      {`
                        .dark .group {
                          box-shadow: var(--toast-shadow) !important;
                          border-color: rgba(255,255,255,0.1) !important;
                        }
                      `}
                    </style>
                  </div>
                ),
                duration: 2000,
              });
            }}
            className="relative h-8 w-8 rounded-lg hover:bg-white/10"
            title={t('copyUrl')}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Direct Play */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowDirectPlayInput(!showDirectPlayInput);
            setShowAddInput(false);
          }}
          title={t('directPlay')}
          className="h-10 w-10 relative rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
        </Button>

        {/* Add to Queue */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowAddInput(!showAddInput);
            setShowDirectPlayInput(false);
          }}
          title={t('addToQueue')}
          className="h-10 w-10 relative rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenQueue}
          title={t('queue')}
          className="h-10 w-10 relative rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm transition-all"
        >
          <ListEnd className="w-5 h-5" />
          {queueCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] bg-red-600 text-white rounded-full flex items-center justify-center ring-2 ring-background">
              {queueCount}
            </span>
          )}
        </Button>

        {/* Theater Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheater}
          title={isTheaterMode ? t('exitTheaterMode') : t('enterTheaterMode')}
          className="h-10 w-10 relative rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm transition-all"
        >
          {isTheaterMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </Button>
      </div>

      {/* Direct Play Input */}
      {showDirectPlayInput && (
        <div className="mt-3 flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="relative flex-1">
            <Input
              placeholder={t('pasteVideoUrl')}
              value={directPlayUrl}
              onChange={(e) => setDirectPlayUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && directPlayUrl.trim()) {
                  onDirectPlay?.(directPlayUrl);
                  setDirectPlayUrl('');
                  setShowDirectPlayInput(false);
                }
              }}
              className="w-full h-10 pl-3 pr-8 rounded-lg bg-card/50 border-white/10 focus-visible:ring-primary/20 shadow-sm backdrop-blur-sm"
              autoFocus
            />
            <button
              onClick={() => { setShowDirectPlayInput(false); setDirectPlayUrl(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <Button
            className="h-10 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-md transition-all hover:scale-105 active:scale-95"
            onClick={() => {
              if (directPlayUrl.trim()) {
                onDirectPlay?.(directPlayUrl);
                setDirectPlayUrl('');
                setShowDirectPlayInput(false);
              }
            }}
            disabled={!directPlayUrl.trim()}
          >
            {t('playVideo')}
            <Play className="w-4 h-4 fill-current ml-2" />
          </Button>
        </div>
      )}

      {/* Add to Queue Input */}
      {showAddInput && (
        <div className="mt-3 flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="relative flex-1">
            <Input
              placeholder={t('pasteVideoUrlDirectly')}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddToQueue()}
              className="w-full h-10 pl-3 pr-8 rounded-lg bg-card/50 border-white/10 focus-visible:ring-primary/20 shadow-sm backdrop-blur-sm"
              autoFocus
            />
            <button
              onClick={() => { setShowAddInput(false); setUrlInput(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <Button
            className="h-10 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-md transition-all hover:scale-105 active:scale-95"
            onClick={handleAddToQueue}
            disabled={!urlInput.trim()}
          >
            {t('playVideo')}
            <Play className="w-4 h-4 fill-current ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
});

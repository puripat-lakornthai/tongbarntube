import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Plus, X, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { YouTubePlayer, YouTubePlayerHandle } from '@/components/YouTubePlayer';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { QueuePanel } from '@/components/QueuePanel';
import { VideoCard } from '@/components/VideoCard';
import { useTheme } from '@/hooks/useTheme';
import { useHistory } from '@/hooks/useHistory';
import { useQueue } from '@/hooks/useQueue';
import { useLanguage } from '@/hooks/useLanguage';
import { getVideoThumbnail, extractPlaylistId, extractVideoId } from '@/utils/youtube';
import type { Video } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function Watch() {
  const { videoId } = useParams<{ videoId: string }>();
  const [searchParams] = useSearchParams();
  const playlistId = searchParams.get('list');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { history, addToHistory, removeFromHistory, clearHistory } = useHistory();
  const { language, toggleLanguage, t } = useLanguage();
  const {
    queue,
    addToQueue,
    removeFromQueue,
    playNextFromQueue,
    clearQueue,
    reorderQueue,
  } = useQueue();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [dominantColor, setDominantColor] = useState<string>('');
  const [theaterMode, setTheaterMode] = useState(false);

  // Ref to control the player imperatively (bypasses update lag)
  const playerControlRef = useRef<YouTubePlayerHandle>(null);

  // Create current video object
  const currentPlayingVideo = useMemo<Video | null>(() => videoId
    ? {
      id: videoId,
      thumbnail: getVideoThumbnail(videoId),
      url: `https://youtube.com/watch?v=${videoId}`,
      playlistId: playlistId || undefined,
      addedAt: Date.now(),
    }
    : null, [videoId, playlistId]);

  // Scroll to top when video changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [videoId]);

  // Ensure current video is always added to history (Move to Top)
  useEffect(() => {
    if (currentPlayingVideo) {
      addToHistory(currentPlayingVideo);
    }
  }, [currentPlayingVideo, addToHistory]);



  // Ref to store playlist context when interrupted by Queue
  const resumePlaylistContext = useRef<{ list: string, index: number } | null>(null);

  // "Sticky" Playlist Ref: Remembers the last active playlist even if URL momentarily drops it
  const lastActivePlaylistId = useRef<string | null>(null);
  useEffect(() => {
    if (playlistId) lastActivePlaylistId.current = playlistId;
  }, [playlistId]);

  // SINGLE SOURCE OF TRUTH Helper
  const getActivePlaylistId = useCallback(() => {
    let listId = playlistId ||
      resumePlaylistContext.current?.list ||
      lastActivePlaylistId.current ||
      playerControlRef.current?.getPlaylistId();

    // 5. Fallback: Parse URL directly (in case React Router is delayed)
    if (!listId) {
      try {
        const params = new URLSearchParams(window.location.search);
        listId = params.get('list') || undefined;
      } catch (e) { }
    }

    return listId;
  }, [playlistId]);

  // CENTRALIZED NAVIGATION HELPER
  const goToVideo = useCallback((id: string, replace = false, extraParams = '', overrideListId?: string | null) => {
    // If overrideListId is provided (string or null), use it.
    // If it's undefined, fall back to "smart" detection (sticky ref / current URL).
    const list = overrideListId !== undefined ? overrideListId : getActivePlaylistId();

    console.log('[Watch] standard navigation:', { id, list, replace, extraParams, overrideListId });

    if (list) {
      navigate(`/watch/${id}?list=${list}${extraParams}`, { replace });
    } else {
      navigate(`/watch/${id}${extraParams ? `?${extraParams.replace(/^&/, '')}` : ''}`, { replace });
    }
  }, [navigate, getActivePlaylistId]);

  const handleVideoEnd = useCallback(() => {
    // 1. Priority: Play from manual Queue
    if (queue.length > 0) {
      // IF we are currently playing a playlist (and not already in a queue detour), save the context
      if (playlistId && !resumePlaylistContext.current) {
        // We need the CURRENT index so we can resume at index + 1
        const currentIndex = playerControlRef.current?.getPlaylistIndex() ?? -1;
        if (currentIndex >= 0) {
          resumePlaylistContext.current = { list: playlistId, index: currentIndex };
        }
      }

      const nextFromQueue = playNextFromQueue();
      if (nextFromQueue) {
        playerControlRef.current?.playVideo(nextFromQueue.id);
        addToHistory(nextFromQueue);

        // FIX: Update sticky playlist ref for auto-play (same logic as Play Now / Manual Queue)
        const nextListId = nextFromQueue.playlistId || null;
        if (nextListId) {
          lastActivePlaylistId.current = nextListId;
        } else {
          lastActivePlaylistId.current = null;
        }

        // Use unified helper with explicit override
        goToVideo(nextFromQueue.id, true, '', nextListId);
      }
      return;
    }

    // 2. Queue is Empty: Check if we need to RESUME a playlist
    if (resumePlaylistContext.current) {
      const { list, index } = resumePlaylistContext.current;
      resumePlaylistContext.current = null; // Clear context after using

      // IMPORTANT: Update sticky ref so goToVideo picks it up
      lastActivePlaylistId.current = list;

      // Resume playlist at next index
      goToVideo(videoId!, true, `&index=${index + 1}`);
      return;
    }

    // 3. Normal Playlist Behavior ...
  }, [queue, playNextFromQueue, addToHistory, goToVideo, playlistId, videoId, navigate]);

  const handleDirectPlay = useCallback((videoOrUrl: Video | string) => {
    let targetVideoId: string | null = null;
    let targetListId: string | null = null;

    if (typeof videoOrUrl === 'string') {
      const url = videoOrUrl.trim();
      if (!url) return;
      targetVideoId = extractVideoId(url);
      targetListId = extractPlaylistId(url);

      // Fallback: Try URL object directly if regex returned nothing
      if (!targetListId) {
        try {
          const u = new URL(url);
          targetListId = u.searchParams.get('list');
        } catch (e) { }
      }
    } else {
      targetVideoId = videoOrUrl.id;
      targetListId = videoOrUrl.playlistId || null;
    }

    if (targetVideoId) {
      if (targetListId) {
        // STRICT PRIORITY: If input has a list, use it. Override sticky ref.
        lastActivePlaylistId.current = targetListId;
        // Pass explicit listId
        goToVideo(targetVideoId, false, '', targetListId);
      } else {
        // NEW FIX: If input has NO list, we must CLEAR the sticky ref.
        lastActivePlaylistId.current = null;
        // Pass explicit NULL to clear playlist
        goToVideo(targetVideoId, false, '', null);
      }
    }
  }, [goToVideo, navigate]);

  const handlePlayFromQueue = useCallback((video: Video) => {
    if (playlistId && !resumePlaylistContext.current) {
      const currentIndex = playerControlRef.current?.getPlaylistIndex() ?? -1;
      if (currentIndex >= 0) {
        resumePlaylistContext.current = { list: playlistId, index: currentIndex };
      }
    }

    removeFromQueue(video.id);
    addToHistory(video);

    const targetListId = video.playlistId || null;
    lastActivePlaylistId.current = targetListId;

    // Pass explicit targetListId (string or null)
    goToVideo(video.id, false, '', targetListId);
  }, [removeFromQueue, addToHistory, goToVideo, playlistId]);

  const handlePlayerVideoPlay = useCallback((playedVideoId: string) => {
    // This is called when the YT player advances to a new video (playlist autoplay)
    if (playedVideoId !== videoId) {
      // CRITICAL: Queue Hijack
      if (queue.length > 0) {
        handleVideoEnd();
        return;
      }

      const autoVideo: Video = {
        id: playedVideoId,
        thumbnail: getVideoThumbnail(playedVideoId),
        url: `https://youtube.com/watch?v=${playedVideoId}`,
        playlistId: playlistId || undefined,
        addedAt: Date.now(),
      };
      addToHistory(autoVideo);

      // SYNC PLAYER STATE TO STICKY REF
      const listFromPlayer = playerControlRef.current?.getPlaylistId();
      if (listFromPlayer) {
        lastActivePlaylistId.current = listFromPlayer;
      }

      goToVideo(playedVideoId, true);
    }
  }, [videoId, playlistId, queue.length, handleVideoEnd, addToHistory, goToVideo]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-1000">
      {/* ... (background) ... */}
      <div className="relative z-10">
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          language={language}
          toggleLanguage={toggleLanguage}
          t={t}
          autoHide // Enable auto-hide for Watch page
        />

        <main className={cn(
          "transition-all duration-700 ease-in-out mx-auto flex flex-col items-center",
          theaterMode ? "w-[98vw] pt-2 pb-4" : "container px-12 max-w-6xl py-12"
        )}>
          {/* Player */}
          <div
            className={cn(
              "mb-4 mx-auto w-full transition-all duration-700 ease-in-out",
              theaterMode ? "animate-theater-enter" : "animate-normal-enter"
            )}
            style={{
              // Theater Mode: Wide but limited by viewport height
              // Expands to 98vw or height-based limit, whichever is smaller
              maxWidth: theaterMode
                ? 'min(100vw, calc((102dvh - 40px) * 1.785))'
                : '100%'
            }}
          >
            <YouTubePlayer
              ref={playerControlRef}
              key={playlistId || "standalone"} // SMART KEY: Persist player for background autoplay, remount only on playlist change
              videoId={videoId!}
              playlistId={playlistId}
              onVideoEnd={handleVideoEnd}
              onOpenQueue={() => setIsQueueOpen(prev => !prev)}
              onAddToQueue={addToQueue}
              onDirectPlay={handleDirectPlay}
              queueCount={queue.length}
              t={t}
              onColorChange={setDominantColor}
              onVideoPlay={handlePlayerVideoPlay}
              isTheaterMode={theaterMode}
              onToggleTheater={() => {
                setTheaterMode(prev => !prev);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

          {/* Recent History */}
          {history.length > 1 && (
            <section className="opacity-0 animate-fade-in stagger-2 mt-20 mb-12 relative w-full rounded-3xl p-6 sm:p-8 overflow-hidden bg-card/40 dark:bg-white/[0.03] backdrop-blur-md border border-border/40 dark:border-white/10 shadow-xl dark:shadow-2xl">
              {/* Premium Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent -z-10" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-border/30 dark:border-white/10 relative z-10">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(var(--primary),0.4)]">
                    <Clock className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.6)] animate-pulse-slow" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 mix-blend-overlay"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 drop-shadow-sm">
                      {t('recentlyWatched')}
                    </h2>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  onClick={clearHistory}
                  className="group relative overflow-hidden rounded-xl h-10 px-6 bg-red-500/10 dark:bg-red-500/15 hover:bg-transparent text-red-600 dark:text-red-400 hover:text-white transition-all duration-500 border border-red-500/30 hover:border-transparent shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                >
                  {/* Subtle pulsing background glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
                  
                  <span className="relative z-10 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em]">
                    <Trash2 className="w-4 h-4 group-hover:-rotate-12 group-hover:scale-110 transition-all duration-300" />
                    {t('clearHistory')}
                  </span>
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 relative z-10">
                {history
                  .filter((item) => item.id !== videoId)
                  .slice(0, 24)
                  .map((item, index) => (
                    <div 
                      key={item.id} 
                      className="group/card animate-fade-in relative transition-all duration-500 hover:-translate-y-1 hover:z-10"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <VideoCard
                        video={item}
                        compact
                        onPlay={() => {
                          addToHistory(item);
                          const listId = item.playlistId || null;
                          lastActivePlaylistId.current = listId; // Keep ref in sync for other components
                          goToVideo(item.id, false, '', listId);
                        }}
                        showRemove
                        onRemove={() => removeFromHistory(item.id)}
                      />
                    </div>
                  ))}
              </div>
            </section>
          )}
        </main>

        <QueuePanel
          isOpen={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
          queue={queue}
          onRemove={removeFromQueue}
          onReorder={reorderQueue}
          onClear={clearQueue}
          onPlay={handlePlayFromQueue}
          t={t}
        />
      </div>
    </div >
  );
}

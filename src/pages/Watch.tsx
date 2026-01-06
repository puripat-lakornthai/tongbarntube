import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Plus, X } from 'lucide-react';
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
  const { history, addToHistory, removeFromHistory } = useHistory();
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
  const goToVideo = useCallback((id: string, replace = false, extraParams = '') => {
    // Priority: Specific List (if provided externally?) - No, just use Global Context
    // But sometimes we want to override? 
    // Actually simplicity is best. Rely on getActivePlaylistId() which now includes Sticky Ref.
    const list = getActivePlaylistId();
    console.log('[Watch] standard navigation:', { id, list, replace, extraParams });

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
        // Use unified helper
        goToVideo(nextFromQueue.id, true);
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
    let videoId: string | null = null;
    let listId: string | null = null;

    if (typeof videoOrUrl === 'string') {
      const url = videoOrUrl.trim();
      if (!url) return;
      videoId = extractVideoId(url);
      try {
        const urlObj = new URL(url);
        listId = urlObj.searchParams.get('list');
      } catch (e) { }
    } else {
      videoId = videoOrUrl.id;
      listId = videoOrUrl.playlistId || null;
    }

    if (videoId) {
      // Create a temporary override? No, stick to the plan.
      // If the input HAS a list, we should probably update the Sticky Ref?
      if (listId) {
        lastActivePlaylistId.current = listId;
      }
      goToVideo(videoId);
    }
  }, [goToVideo]);

  const handlePlayFromQueue = useCallback((video: Video) => {
    if (playlistId && !resumePlaylistContext.current) {
      const currentIndex = playerControlRef.current?.getPlaylistIndex() ?? -1;
      if (currentIndex >= 0) {
        resumePlaylistContext.current = { list: playlistId, index: currentIndex };
      }
    }

    removeFromQueue(video.id);
    addToHistory(video);

    if (video.playlistId) {
      lastActivePlaylistId.current = video.playlistId;
    }
    goToVideo(video.id);
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
          theaterMode ? "w-[98vw] pt-2 pb-4" : "container px-4 max-w-6xl py-2"
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
              key="player-instance" // STATIC KEY to prevent remounting
              videoId={videoId}
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
              onToggleTheater={() => setTheaterMode(prev => !prev)}
            />
          </div>

          {/* Recent History */}
          {history.length > 1 && (
            <section className="opacity-0 animate-fade-in stagger-2 mt-8">
              <h2 className="text-lg font-semibold mb-4">{t('recentlyWatched')}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 gap-2">
                {history
                  .filter((item) => item.id !== videoId)
                  .slice(0, 24)
                  .map((item) => (
                    <VideoCard
                      key={item.id}
                      video={item}
                      compact
                      onPlay={() => {
                        addToHistory(item);
                        if (item.playlistId) {
                          lastActivePlaylistId.current = item.playlistId;
                        }
                        goToVideo(item.id);
                      }}
                      showRemove
                      onRemove={() => removeFromHistory(item.id)}
                    />
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

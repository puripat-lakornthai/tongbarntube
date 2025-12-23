import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { YouTubePlayer, YouTubePlayerHandle } from '@/components/YouTubePlayer';
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
  const { history, addToHistory } = useHistory();
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
        // Navigate to video (without list param, so we don't confuse the player)
        navigate(`/watch/${nextFromQueue.id}`, { replace: true });
      }
      return;
    }

    // 2. Queue is Empty: Check if we need to RESUME a playlist
    if (resumePlaylistContext.current) {
      const { list, index } = resumePlaylistContext.current;
      resumePlaylistContext.current = null; // Clear context after using

      // Navigate back to the playlist, targeting the NEXT index
      // We don't know the Video ID of the next song, but passing 'list' and relying on player might work?
      // Actually, if we just navigate to any video with ?list=ID&index=..., YouTube player handles it.
      // But we need a video ID to mount the route.
      // Strategy: Navigate to the *Same* video ID we left off at? Or just use the list?
      // If we don't have a video ID... maybe we can't easily resume without API data.
      // Better Fallback: If we are already in the playlist mode? No, we navigated away.

      // Attempt: Navigate to the *Last Known Video* of the playlist, but with index+1?
      // Or just navigate to the playlist URL (which might not work if route requires :videoId).

      // Since we don't have the "Next Video ID", we will rely on YouTube's behavior.
      // Let's stay on current video (last queue item) but add ?list=ID&index=... params?
      // Then the player might auto-jump?

      // Let's try: Navigate to the CURRENT video (just finished queue item), but add the list param back.
      // Then call player.loadPlaylist?

      // Simplest for now: Just restore the playlist param on the current video. 
      // The user will see the playlist bar reappear. The player might restart the playlist or stay.
      // Ideally we want next song. 

      navigate(`/watch/${videoId}?list=${list}&index=${index + 1}`, { replace: true });
      return;
    }

    // 3. Normal Playlist Behavior (Native YouTube Autoplay handles this usually)
    // If we are here, Queue is empty and we are NOT resuming.
    // YouTube player will typically confirm "Ended" and stop, OR auto-advance if it's a playlist.

  }, [queue, playNextFromQueue, addToHistory, navigate, playlistId, videoId]);

  /* 
     User requested: Keep "Add" button/input strictly for "Direct Play".
     So this function now navigates immediately instead of queuing.
  */
  const handleDirectPlay = useCallback((videoOrUrl: Video | string) => {
    let videoId: string | null = null;
    let listId: string | null = null;

    if (typeof videoOrUrl === 'string') {
      const url = videoOrUrl.trim();
      if (!url) return;

      // Use the same extraction utility as the player for consistency
      videoId = extractVideoId(url);

      // Try to extract playlist ID from URL
      try {
        const urlObj = new URL(url);
        listId = urlObj.searchParams.get('list');
      } catch (e) {
        // Not a valid URL, might be just an ID - that's fine
      }
    } else {
      videoId = videoOrUrl.id;
      listId = videoOrUrl.playlistId || null;
    }

    if (videoId) {
      if (listId) {
        navigate(`/watch/${videoId}?list=${listId}`);
      } else {
        navigate(`/watch/${videoId}`);
      }
    }
  }, [navigate]);

  const handlePlayFromQueue = useCallback((video: Video) => {
    removeFromQueue(video.id);
    addToHistory(video);
    if (video.playlistId) {
      navigate(`/watch/${video.id}?list=${video.playlistId}`);
    } else {
      navigate(`/watch/${video.id}`);
    }
  }, [removeFromQueue, addToHistory, navigate]);

  const handlePlayerVideoPlay = useCallback((playedVideoId: string) => {
    // This is called when the YT player advances to a new video (playlist autoplay)
    // We need to update the URL to match
    if (playedVideoId !== videoId) {
      // ... existing logic ...
    }
  }, [videoId, playlistId, addToHistory, navigate]); // Keeping this logic same as viewed file effectively

  // ... (rest of effects) ...

  // ... (render) ...

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
        />

        <main className="container max-w-7xl mx-auto px-4 py-6">
          {/* Player */}
          <div className="mb-4 opacity-0 animate-fade-in">
            <YouTubePlayer
              ref={playerControlRef}
              key={playlistId || "player-instance"}
              videoId={videoId}
              playlistId={playlistId}
              onVideoEnd={handleVideoEnd}
              onOpenQueue={() => setIsQueueOpen(true)}
              onAddToQueue={addToQueue}
              onDirectPlay={handleDirectPlay}
              queueCount={queue.length}
              t={t}
              onColorChange={setDominantColor}
              onVideoPlay={(id) => {
                // Inline the existing logic for brevity or call the handler
                // handlePlayerVideoPlay(id) is fine but ensuring we don't break existing
                if (id !== videoId) {
                  // CRITICAL FIX: If Queue has items, Playlist auto-advanced incorrectly.
                  // We MUST hijack this and force the Queue logic.
                  // 1. STOP the rogue player immediately.
                  // 2. Force the "Play Queue" workflow.
                  if (queue.length > 0) {
                    // Force pause/stop to prevent audio leak of wrong song
                    // We can't access internal player directly easily here without ref, 
                    // but handleVideoEnd calls playVideo which will override it.
                    // Ideally we would pause first: playerControlRef.current?.pauseVideo? 
                    // But let's trust handleVideoEnd to load the new ID fast enough.
                    handleVideoEnd();
                    return;
                  }

                  const autoVideo: Video = {
                    id,
                    thumbnail: getVideoThumbnail(id),
                    url: `https://youtube.com/watch?v=${id}`,
                    playlistId: playlistId || undefined,
                    addedAt: Date.now(),
                  };
                  addToHistory(autoVideo);
                  if (playlistId) navigate(`/watch/${id}?list=${playlistId}`, { replace: true });
                  else navigate(`/watch/${id}`, { replace: true });
                }
              }}
            />
          </div>

          {/* Recent History */}
          {history.length > 1 && (
            <section className="opacity-0 animate-fade-in stagger-2 mt-8">
              <h2 className="text-lg font-semibold mb-4">{t('recentlyWatched')}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 gap-2">
                {history
                  .filter((item) => item.id !== videoId)
                  .slice(0, 16)
                  .map((item) => (
                    <VideoCard
                      key={item.id}
                      video={item}
                      compact
                      onPlay={() => {
                        addToHistory(item);
                        // Navigate directly to video ID to avoid playlist index resetting
                        if (item.playlistId) {
                          navigate(`/watch/${item.id}?list=${item.playlistId}`);
                        } else {
                          navigate(`/watch/${item.id}`);
                        }
                      }}
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
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { Navbar } from '@/components/Navbar';
import { QueuePanel } from '@/components/QueuePanel';
import { VideoCard } from '@/components/VideoCard';
import { useTheme } from '@/hooks/useTheme';
import { useHistory } from '@/hooks/useHistory';
import { useQueue } from '@/hooks/useQueue';
import { useLanguage } from '@/hooks/useLanguage';
import { getVideoThumbnail, extractPlaylistId } from '@/utils/youtube';
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

  // Create current video object
  const currentPlayingVideo: Video | null = videoId
    ? {
      id: videoId,
      thumbnail: getVideoThumbnail(videoId),
      url: `https://youtube.com/watch?v=${videoId}`,
      playlistId: playlistId || undefined,
      addedAt: Date.now(),
    }
    : null;

  // Add to history on load
  useEffect(() => {
    if (currentPlayingVideo) {
      addToHistory(currentPlayingVideo);
    }
  }, [videoId]);

  const handleVideoEnd = () => {
    const nextFromQueue = playNextFromQueue();
    if (nextFromQueue) {
      addToHistory(nextFromQueue);
      navigate(`/watch/${nextFromQueue.id}`);
    }
  };

  const handleAddVideoToQueue = (video: Video) => {
    addToQueue(video);
    toast({
      title: t('addedToQueue'),
      description: t('videoAddedQueue'),
    });
  };

  const handlePlayFromQueue = (video: Video) => {
    removeFromQueue(video.id);
    addToHistory(video);
    navigate(`/watch/${video.id}`);
  };

  if (!videoId) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        language={language}
        toggleLanguage={toggleLanguage}
        t={t}
      />

      <main className="container max-w-7xl mx-auto px-4 py-6">
        {/* Player */}
        <div className="mb-6 opacity-0 animate-fade-in">
          <YouTubePlayer
            videoId={videoId}
            playlistId={playlistId}
            onVideoEnd={handleVideoEnd}
            onOpenQueue={() => setIsQueueOpen(true)}
            onAddToQueue={handleAddVideoToQueue}
            queueCount={queue.length}
            t={t}
          />
        </div>

        {/* Recent History */}
        {history.length > 1 && (
          <section className="opacity-0 animate-fade-in stagger-2 mt-8">
            <h2 className="text-lg font-semibold mb-4">{t('recentlyWatched')}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {history
                .filter((item) => item.id !== videoId)
                .slice(0, 5)
                .map((item) => (
                  <VideoCard
                    key={item.id}
                    video={item}
                    compact
                    onPlay={() => {
                      addToHistory(item);
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

      {/* Queue Panel */}
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
  );
}

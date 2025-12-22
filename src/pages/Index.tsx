import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, History, Zap, Shield, Sparkles, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FeatureCard } from '@/components/FeatureCard';
import { VideoCard } from '@/components/VideoCard';
import { Navbar } from '@/components/Navbar';
import { useTheme } from '@/hooks/useTheme';
import { useHistory } from '@/hooks/useHistory';
import { useLanguage } from '@/hooks/useLanguage';
import { extractVideoId, extractPlaylistId, getVideoThumbnail } from '@/utils/youtube';
import type { Video } from '@/types';

export default function Index() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { history, addToHistory, clearHistory, removeFromHistory } = useHistory();
  const { language, toggleLanguage, t } = useLanguage();

  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(url);
    const playlistId = extractPlaylistId(url);

    if (!videoId) {
      setError(t('invalidUrlDesc'));
      return;
    }

    const video: Video = {
      id: videoId,
      thumbnail: getVideoThumbnail(videoId),
      url: url.trim(),
      playlistId: playlistId || undefined,
      addedAt: Date.now(),
    };

    addToHistory(video);

    // Navigate with playlist ID if present
    if (playlistId) {
      navigate(`/watch/${videoId}?list=${playlistId}`);
    } else {
      navigate(`/watch/${videoId}`);
    }
  };

  const handlePlayFromHistory = (video: Video) => {
    addToHistory(video);
    if (video.playlistId) {
      navigate(`/watch/${video.id}?list=${video.playlistId}`);
    } else {
      navigate(`/watch/${video.id}`);
    }
  };

  const features = [
    {
      icon: Zap,
      title: t('noAdsTitle'),
      description: t('noAdsDesc'),
    },
    {
      icon: History,
      title: t('historyTitle'),
      description: t('historyDesc'),
    },
    {
      icon: Shield,
      title: t('themeTitle'),
      description: t('themeDesc'),
    },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        language={language}
        toggleLanguage={toggleLanguage}
        t={t}
      />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] gradient-glow opacity-60 animate-pulse-glow pointer-events-none" />

        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          {/* Logo */}
          <div className="inline-flex items-center justify-center mb-8 opacity-0 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
              <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground ml-1" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 opacity-0 animate-fade-in stagger-1">
            Tongbarn<span className="text-gradient">Tube</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 opacity-0 animate-fade-in stagger-2">
            {t('tagline')}
          </p>

          {/* URL Input */}
          <form
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto mb-8 opacity-0 animate-fade-in-up stagger-3"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder={t('pasteUrl')}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                  }}
                  className="h-14 text-lg pl-5 pr-5 rounded-xl shadow-soft"
                />
              </div>
              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="rounded-xl"
              >
                <Play className="w-5 h-5 fill-current" />
                {t('watch')}
              </Button>
            </div>
            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 opacity-0 animate-fade-in">
            <Sparkles className="inline-block w-6 h-6 mr-2 text-primary" />
            {t('features')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={100 + index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Recently Watched Section */}
      {history.length > 0 && (
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                {t('recentlyWatched')}
              </h2>
              <Button variant="ghost" onClick={clearHistory}>
                <Trash2 className="w-4 h-4 mr-1" />
                {t('clearHistory')}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.slice(0, 6).map((item, index) => (
                <div
                  key={item.id}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <VideoCard
                    video={item}
                    onPlay={() => handlePlayFromHistory(item)}
                    showRemove
                    onRemove={() => removeFromHistory(item.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>TongbarnTube • {t('tagline')}</p>
        </div>
      </footer>
    </div>
  );
}

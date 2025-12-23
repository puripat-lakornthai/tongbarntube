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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Glow Effect - Page Wide */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1000px] gradient-glow opacity-40 dark:opacity-60 animate-pulse-glow pointer-events-none -z-50" />

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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[750px] gradient-glow opacity-60 animate-pulse-glow pointer-events-none" />

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
        <section className="relative py-16 px-4 overflow-hidden">
          {/* Ambient Glow for Recently Watched - SCALABLE & EXPANDING */}
          <div className="absolute inset-x-0 top-0 bottom-0 bg-[radial-gradient(ellipse_at_center,var(--primary)/0.15,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,var(--primary)/0.3,transparent_70%)] blur-3xl pointer-events-none -z-10" />
          <div className="absolute inset-x-0 top-0 bottom-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,var(--primary)/0.1_180deg,transparent_360deg)] opacity-40 dark:opacity-60 blur-[80px] pointer-events-none -z-10" />

          <div className="container max-w-6xl mx-auto relative z-10">
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
              {history.slice(0, 21).map((item, index) => (
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
      {/* Footer */}
      <footer className="relative mt-20 border-t border-border/40 overflow-hidden">
        {/* background layers */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/60" />

        {/* Enhanced Ambient Light for Dark Mode */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--primary)/0.15,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom,var(--primary)/0.3,transparent_80%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/10 to-transparent dark:from-primary/20 pointer-events-none" />

        <div className="relative w-full">
          <div className="container max-w-7xl mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10 w-full">

              {/* Decorative Image (LEFT) - Contained & Big */}
              <div className="hidden lg:block absolute -bottom-24 -left-10 opacity-90 dark:opacity-80 pointer-events-none select-none z-0">
                <img
                  src="/o1.png"
                  alt=""
                  className="h-[350px] w-auto object-contain drop-shadow-2xl"
                />
              </div>

              {/* Text Content (CENTER) */}
              <div className="flex-1 text-center md:text-center z-10 w-full relative flex flex-col items-center">
                {/* Logo */}
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground/90 drop-shadow-lg">
                    Tongbarn<span className="text-gradient drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">Tube</span>
                  </h1>
                </div>

                <p className="text-xs text-muted-foreground/60 tracking-wider uppercase">
                  © {new Date().getFullYear()} All rights reserved
                </p>
              </div>

              {/* Decorative Image (RIGHT) - Contained & Big */}
              <div className="hidden lg:block absolute -bottom-24 -right-10 opacity-90 dark:opacity-80 pointer-events-none select-none z-0">
                <img
                  src="/o1.png"
                  alt=""
                  className="h-[350px] w-auto object-contain drop-shadow-2xl scale-x-[-1]"
                />
              </div>

            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

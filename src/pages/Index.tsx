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


      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        language={language}
        toggleLanguage={toggleLanguage}
        t={t}
      // alwaysShow
      />

      {/* Global Background Effects (Moved out of Hero for seamless light mode) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-20%] w-[90vw] h-[90vw] rounded-full bg-primary/10 blur-[180px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[90vw] h-[90vw] rounded-full bg-blue-500/10 blur-[180px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-playful-light opacity-60" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-4">

        <div className="container max-w-4xl mx-auto text-center relative z-10">

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-balance animate-fade-in">
            Tongbarn<span className="text-gradient">Tube</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground/80 mb-16 max-w-2xl mx-auto font-light tracking-wide animate-fade-in stagger-1">
            {t('tagline')}
          </p>

          <form
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto mb-12 animate-fade-in stagger-2"
          >
            <div className="relative group">
              <div className="relative flex items-center bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-2 transition-all duration-300 focus-within:ring-1 focus-within:ring-primary/20 focus-within:bg-card/80 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/20">
                <Input
                  type="text"
                  placeholder={t('pasteUrl')}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                  }}
                  className="h-14 border-0 bg-transparent shadow-none focus-visible:ring-0 text-lg px-6 placeholder:text-muted-foreground/40 font-light"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-xl px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-red-500/80 text-sm mt-4 font-medium animate-fade-in">{error}</p>
            )}
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 flex items-center justify-center gap-3 animate-fade-in group cursor-default">
              <Sparkles className="w-8 h-8 text-primary animate-pulse-glow group-hover:rotate-12 group-hover:scale-125 transition-all duration-500" />
              {t('features')}
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={200 + index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Recently Watched - Minimal */}
      {history.length > 0 && (
        <section className="pb-32 px-4">
          <div className="mx-auto w-full max-w-[1800px] px-6">
            <div className="flex items-center justify-between mb-12 border-b border-border/20 pb-6">
              <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                {t('recentlyWatched')}
              </h2>
              <Button
                variant="destructive"
                onClick={clearHistory}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
                size="sm"
              >
                {t('clearHistory')}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {history.slice(0, 20).map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-in"
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
              <div className="hidden lg:block absolute -bottom-24 -left-10 opacity-90 dark:opacity-80 pointer-events-none select-none z-0 animate-float-slow">
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
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90 drop-shadow-lg">
                    Tongbarn<span className="text-gradient drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">Tube</span>
                  </h1>
                </div>

                <p className="text-xs text-muted-foreground/60 tracking-wider uppercase">
                  © {new Date().getFullYear()} All rights reserved
                </p>
              </div>

              {/* Decorative Image (RIGHT) - Contained & Big */}
              <div className="hidden lg:block absolute -bottom-24 -right-10 opacity-90 dark:opacity-80 pointer-events-none select-none z-0 animate-float-slow" style={{ animationDelay: '1s' }}>
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

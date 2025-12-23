import { forwardRef, useState } from 'react';
import { Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVideoThumbnail } from '@/utils/youtube';
import { cn } from '@/lib/utils';
import type { Video } from '@/types';

interface VideoCardProps {
  video: Video;
  isActive?: boolean;
  showDragHandle?: boolean;
  showRemove?: boolean;
  onPlay?: () => void;
  onRemove?: () => void;
  compact?: boolean;
}

export const VideoCard = forwardRef<HTMLDivElement, VideoCardProps>(
  function VideoCard(
    {
      video,
      isActive = false,
      showRemove = false,
      onPlay,
      onRemove,
      compact = false,
    },
    ref
  ) {
    const [imageError, setImageError] = useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          "group relative rounded-xl overflow-hidden transition-all duration-200",
          "bg-card border border-border/50 shadow-card",
          "hover:shadow-lg hover:border-primary/20 hover:scale-[1.02]",
          isActive && "ring-2 ring-primary border-primary/50"
        )}
      >
        {/* Thumbnail */}
        <div
          className="relative aspect-video w-full overflow-hidden cursor-pointer"
          onClick={onPlay}
        >
          <img
            src={imageError ? '/placeholder.svg' : getVideoThumbnail(video.id)}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />

          {/* Play Overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200",
            "opacity-0 group-hover:opacity-100"
          )}>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
            </div>
          </div>

          {/* Active Indicator */}
          {isActive && (
            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full">
              ▶
            </div>
          )}
        </div>

        {/* Actions - Only show on hover */}
        <div className={cn(
          "absolute top-1 right-1 flex items-center gap-1",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          isActive && "opacity-100"
        )}>
          {showRemove && onRemove && !isActive && (
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);

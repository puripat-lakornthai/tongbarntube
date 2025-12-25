import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group p-6 rounded-2xl transition-all duration-500",
        "bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30",
        "shadow-sm hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-transparent flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-500">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

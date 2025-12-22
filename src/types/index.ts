export interface Video {
  id: string;
  title?: string;
  thumbnail: string;
  url: string;
  playlistId?: string;
  addedAt: number;
}

export interface HistoryItem extends Video {
  watchedAt: number;
}

export type ThemeMode = 'light' | 'dark';

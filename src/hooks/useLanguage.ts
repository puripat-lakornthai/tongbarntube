import { useState, useEffect, createContext, useContext } from 'react';

export type Language = 'en' | 'th';

export const translations = {
  en: {
    // App
    appName: 'TongbarnTube',
    tagline: 'Distraction-free YouTube watching',

    // Home
    pasteUrl: 'Paste YouTube URL...',
    watch: 'Watch',
    features: 'Features',
    recentlyWatched: 'Recently Watched',
    yourPlaylists: 'Your Playlists',
    clearHistory: 'Clear History',
    viewAll: 'View All',
    createPlaylist: 'Create Playlist',

    // Features
    playlistsTitle: 'Playlists',
    playlistsDesc: 'Create and manage your video collections',
    historyTitle: 'Watch History',
    historyDesc: 'Track your recently watched videos',
    themeTitle: 'Themes',
    themeDesc: 'Switch between light and dark mode',
    noAdsTitle: 'No Distractions',
    noAdsDesc: 'Clean interface, focused viewing',

    // Player
    nowPlaying: 'Now Playing',
    addToQueue: 'Add to Queue',
    queue: 'Queue',
    playlists: 'Playlists',
    playlistInfo: 'Playlist:',

    // Playlist
    newPlaylistName: 'New playlist name...',
    noPlaylists: 'No playlists yet',
    createToStart: 'Create one to get started',
    noVideos: 'No videos in this playlist',
    addVideos: 'Add videos to get started',
    videos: 'videos',
    video: 'video',
    addVideoUrl: 'Paste YouTube URL or playlist...',
    addVideo: 'Add Video',
    importPlaylist: 'Import YouTube Playlist',
    playing: 'Playing',

    // Queue
    playQueue: 'Play Queue',
    clearQueue: 'Clear All',
    emptyQueue: 'Queue is empty',
    queueEmpty: 'Queue is empty',
    addVideosQueue: 'Add videos to play next',
    playlist: 'Playlist',

    // Actions
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    play: 'Play',
    playVideo: 'Add',
    directPlay: 'Play Now',
    pasteVideoUrl: 'Paste YouTube URL to play...',
    pasteVideoUrlDirectly: 'Paste YouTube URL to queue...',
    copyUrl: 'Copy URL',
    copied: 'Copied!',
    remove: 'Remove',
    clear: 'Clear',
    home: 'Home',

    // Messages
    invalidUrl: 'Invalid URL',
    invalidUrlDesc: 'Please enter a valid YouTube URL',
    addedToQueue: 'Added to queue',
    videoAddedQueue: 'Video added to your play queue',
    addedToPlaylist: 'Added to playlist',
    videoAddedPlaylist: 'Video added to playlist',
    importingPlaylist: 'Importing playlist...',
    playlistImported: 'Playlist imported',
    videosImported: 'videos imported',
    errorImporting: 'Error importing playlist',
    tryAgain: 'Please try again',
  },
  th: {
    // App
    appName: 'TongbarnTube',
    tagline: 'ดู YouTube แบบไม่มีสิ่งรบกวน',

    // Home
    pasteUrl: 'วาง URL YouTube...',
    watch: 'ดู',
    features: 'ฟีเจอร์',
    recentlyWatched: 'ดูล่าสุด',
    yourPlaylists: 'เพลย์ลิสต์ของคุณ',
    clearHistory: 'ล้างประวัติ',
    viewAll: 'ดูทั้งหมด',
    createPlaylist: 'สร้างเพลย์ลิสต์',

    // Features
    playlistsTitle: 'เพลย์ลิสต์',
    playlistsDesc: 'สร้างและจัดการคอลเลกชันวิดีโอ',
    historyTitle: 'ประวัติการดู',
    historyDesc: 'ติดตามวิดีโอที่ดูล่าสุด',
    themeTitle: 'ธีม',
    themeDesc: 'เปลี่ยนระหว่างโหมดสว่างและมืด',
    noAdsTitle: 'ไม่มีสิ่งรบกวน',
    noAdsDesc: 'อินเทอร์เฟซที่สะอาด มุ่งเน้นการดู',

    // Player
    nowPlaying: 'กำลังเล่น',
    addToQueue: 'เพิ่มในคิว',
    queue: 'คิว',
    playlists: 'เพลย์ลิสต์',
    playlistInfo: 'เพลย์ลิสต์:',

    // Playlist
    newPlaylistName: 'ชื่อเพลย์ลิสต์ใหม่...',
    noPlaylists: 'ยังไม่มีเพลย์ลิสต์',
    createToStart: 'สร้างเพื่อเริ่มต้น',
    noVideos: 'ไม่มีวิดีโอในเพลย์ลิสต์นี้',
    addVideos: 'เพิ่มวิดีโอเพื่อเริ่มต้น',
    videos: 'วิดีโอ',
    video: 'วิดีโอ',
    addVideoUrl: 'วาง URL YouTube หรือเพลย์ลิสต์...',
    addVideo: 'เพิ่มวิดีโอ',
    importPlaylist: 'นำเข้าเพลย์ลิสต์ YouTube',
    playing: 'กำลังเล่น',

    // Queue
    playQueue: 'คิวเล่น',
    clearQueue: 'ล้างทั้งหมด',
    emptyQueue: 'คิวว่างเปล่า',
    queueEmpty: 'คิวว่างเปล่า',
    addVideosQueue: 'เพิ่มวิดีโอเพื่อเล่นต่อไป',
    playlist: 'เพลย์ลิสต์',

    // Actions
    cancel: 'ยกเลิก',
    save: 'บันทึก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    add: 'เพิ่ม',
    play: 'เล่น',
    playVideo: 'เพิ่ม',
    directPlay: 'เล่นทันที',
    pasteVideoUrl: 'วาง URL YouTube เพื่อเล่น...',
    pasteVideoUrlDirectly: 'วาง URL YouTube เพื่อเพิ่มในคิว...',
    copyUrl: 'คัดลอก URL',
    copied: 'คัดลอกแล้ว!',
    remove: 'ลบ',
    clear: 'ล้าง',
    home: 'หน้าแรก',

    // Messages
    invalidUrl: 'URL ไม่ถูกต้อง',
    invalidUrlDesc: 'กรุณาใส่ URL YouTube ที่ถูกต้อง',
    addedToQueue: 'เพิ่มในคิวแล้ว',
    videoAddedQueue: 'เพิ่มวิดีโอในคิวเรียบร้อย',
    addedToPlaylist: 'เพิ่มในเพลย์ลิสต์แล้ว',
    videoAddedPlaylist: 'เพิ่มวิดีโอในเพลย์ลิสต์เรียบร้อย',
    importingPlaylist: 'กำลังนำเข้าเพลย์ลิสต์...',
    playlistImported: 'นำเข้าเพลย์ลิสต์แล้ว',
    videosImported: 'วิดีโอที่นำเข้า',
    errorImporting: 'เกิดข้อผิดพลาดในการนำเข้า',
    tryAgain: 'กรุณาลองอีกครั้ง',
  },
};

export type TranslationKey = keyof typeof translations.en;

const LANGUAGE_KEY = 'tongbarntube-language';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return (stored as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'th' : 'en'));
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return { language, setLanguage, toggleLanguage, t };
}

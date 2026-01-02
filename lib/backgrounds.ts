// Curated list of high-quality local backgrounds for Real Estate (14 JPG + 6 AVIF = 20 total)
// Priority: AVIF files for better compression, fallback to JPG
export const HERO_BACKGROUNDS = [
    '/backgrounds/bg9.jpg',
    '/backgrounds/bg10.jpg',
    '/backgrounds/bg11.jpg',
    '/backgrounds/bg12.jpg',
    '/backgrounds/bg13.jpg',
    '/backgrounds/bg14.jpg',
    '/backgrounds/bg1.jpg',
    '/backgrounds/bg2.jpg',
    '/backgrounds/bg3.jpg',
    '/backgrounds/bg4.jpg',
    '/backgrounds/bg5.jpg',
    '/backgrounds/bg6.jpg',
    '/backgrounds/bg7.jpg',
    '/backgrounds/bg8.jpg',
    '/backgrounds/bg15.jpg',
    '/backgrounds/bg16.jpg',
    '/backgrounds/bg17.jpg',
    '/backgrounds/bg18.jpg',
    '/backgrounds/bg19.jpg',
    '/backgrounds/bg20.jpg',
];

export const getRandomBackground = (): string => {
    const randomIndex = Math.floor(Math.random() * HERO_BACKGROUNDS.length);
    return HERO_BACKGROUNDS[randomIndex];
};

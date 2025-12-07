// Curated list of high-quality Unsplash images for Real Estate / Architecture backgrounds
export const HERO_BACKGROUNDS = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920', // Modern living room
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1920', // Modern kitchen
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1920', // Modern exterior
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1920', // White house blue sky
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1920', // Modern interior
    'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&q=80&w=1920', // Luxury bathroom
];

export const getRandomBackground = (): string => {
    const randomIndex = Math.floor(Math.random() * HERO_BACKGROUNDS.length);
    return HERO_BACKGROUNDS[randomIndex];
};

import { LookupCategory } from '@/lib/services/lookup.service';

export interface TagPreset {
    id: string;
    label: string;
    icon: string;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const createPreset = (label: string, icon: string, id?: string): TagPreset => ({
    id: id ?? slugify(label),
    label,
    icon,
});

const FACILITY_TAGS: TagPreset[] = [
    createPreset('Open till midnight', '/club/facilities/Clock (1).svg'),
    createPreset('Disabled Access', '/club/facilities/Wheelchair.svg'),
    createPreset('Car Parking', '/club/facilities/LetterCircleP.svg'),
    createPreset('Private dining space', '/club/facilities/ForkKnife.svg'),
    createPreset('Indoor Seating', '/club/facilities/Armchair.svg'),
    createPreset('Table booking', '/club/facilities/PicnicTable.svg'),
];

const FOOD_TAGS: TagPreset[] = [
    createPreset('Gluten free options', '/club/food/BowlFood (1).svg'),
    createPreset('Bar Snacks', '/club/food/Popcorn (1).svg'),
    createPreset('Asian', '/club/food/FishSimple.svg'),
    createPreset('Italian', '/club/food/Pizza (1).svg'),
    createPreset('Continental', '/club/food/BowlFood (1).svg', 'continental'),
    createPreset('North Indian', '/club/food/CookingPot (1).svg'),
    createPreset('Burgers & Sandwich', '/club/food/Hamburger (1).svg'),
    createPreset('Steak', '/filter/Steak.svg'),
    createPreset('Kebabs', '/filter/Kebabs.svg'),
    createPreset('Desserts', '/filter/Cookie.svg'),
];

const MUSIC_TAGS: TagPreset[] = [
    createPreset('Karaoke', '/club/music/MicrophoneStage.svg'),
    createPreset('DJs', '/club/music/Equalizer.svg'),
    createPreset('Live Music', '/club/music/Guitar.svg'),
];

const BAR_TAGS: TagPreset[] = [
    createPreset('Spirits', '/club/bar/Brandy (1).svg'),
    createPreset('Wine', '/club/bar/Wine (1).svg'),
    createPreset('Draught', '/club/bar/BeerStein (1).svg'),
    createPreset('Cocktail', '/club/bar/Martini (1).svg'),
    createPreset('Non Alcoholic', '/club/bar/PintGlass (1).svg', 'non-alcoholic'),
];

export const TAG_PRESETS: Record<LookupCategory, TagPreset[]> = {
    facilities: FACILITY_TAGS,
    foodCuisines: FOOD_TAGS,
    music: MUSIC_TAGS,
    barOptions: BAR_TAGS,
};

const ICON_LOOKUP: Record<LookupCategory, Record<string, string>> = Object.entries(TAG_PRESETS).reduce((acc, [category, presets]) => {
    acc[category as LookupCategory] = presets.reduce<Record<string, string>>((inner, preset) => {
        inner[slugify(preset.label)] = preset.icon;
        inner[preset.id] = preset.icon;
        return inner;
    }, {});
    return acc;
}, {} as Record<LookupCategory, Record<string, string>>);

const normalizeIconPath = (icon?: string) => {
    if (!icon) return undefined;
    if (icon.startsWith('/')) return icon;
    return `/filter/${icon}`;
};

export const getTagIcon = (
    category: LookupCategory,
    label?: string,
    providedIcon?: string
): string | undefined => {
    const normalizedProvided = normalizeIconPath(providedIcon);
    if (normalizedProvided) {
        return normalizedProvided;
    }
    if (!label) return undefined;
    const slug = slugify(label);
    return ICON_LOOKUP[category]?.[slug];
};

export const toLookupItems = (category: LookupCategory) =>
    TAG_PRESETS[category].map((preset) => ({
        id: preset.id,
        label: preset.label,
        icon: preset.icon,
        active: true,
    }));
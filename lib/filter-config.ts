import { FilterSection } from '@/components/common/filter-popup';

export const CLUB_FILTER_SECTIONS: FilterSection[] = [
    {
        id: 'sort',
        title: 'Sort by',
        type: 'radio',
        options: [
            { id: 'popularity', label: 'Popularity', selected: false },
            { id: 'rating', label: 'Rating', selected: false },
            { id: 'distance', label: 'Distance', selected: false },
            { id: 'cost', label: 'Cost', selected: false },
            { id: 'vibe', label: 'vibe', selected: false },
        ]
    },
    {
        id: 'bar',
        title: 'Bar',
        type: 'checkbox',
        options: [
            { id: 'spirits', label: 'Spirits', icon: 'Brandy.svg', selected: false },
            { id: 'wine', label: 'Wine', icon: 'Wine.svg', selected: false },
            { id: 'draught', label: 'Draught', icon: 'PintGlass.svg', selected: false },
            { id: 'cocktail', label: 'Cocktail', icon: 'Martini.svg', selected: false },
            { id: 'non-alcoholic', label: 'Non Alcoholic', icon: 'Orange.svg', selected: false },
            { id: 'mocktail', label: 'Mocktail', icon: 'Mocktails.svg', selected: false },
            { id: 'coffee', label: 'Coffee', icon: 'Coffee.svg', selected: false },
        ]
    },
    {
        id: 'food',
        title: 'Food',
        type: 'checkbox',
        options: [
            { id: 'gluten-free', label: 'Gluten free options', icon: 'mdi_food-croissant.svg', selected: false },
            { id: 'asian', label: 'Asian', icon: 'BowlFood.svg', selected: false },
            { id: 'italian', label: 'Italian', icon: 'Pizza.svg', selected: false },
            { id: 'burgers-sandwich', label: 'Burgers & Sandwich', icon: 'Hamburger.svg', selected: false },
            { id: 'north-indian', label: 'North Indian', icon: 'CookingPot.svg', selected: false },
            { id: 'bar-snacks', label: 'Bar Snacks', icon: 'Popcorn.svg', selected: false },
            { id: 'continental', label: 'Continental', icon: 'mdi_food-croissant.svg', selected: false },
            { id: 'steak', label: 'Steak', icon: 'Steak.svg', selected: false },
            { id: 'kebabs', label: 'Kebabs', icon: 'Kebabs.svg', selected: false },
            { id: 'desserts', label: 'Desserts', icon: 'Cookie.svg', selected: false },
        ]
    }
];

export const EVENT_FILTER_SECTIONS: FilterSection[] = [
    {
        id: 'sort',
        title: 'Sort by',
        type: 'radio',
        options: [
            { id: 'popularity', label: 'Popularity', selected: false },
            { id: 'rating', label: 'Rating', selected: false },
            { id: 'distance', label: 'Distance', selected: false },
            { id: 'date', label: 'Date', selected: false },
            { id: 'price', label: 'Price', selected: false },
        ]
    },
    {
        id: 'bar',
        title: 'Bar',
        type: 'checkbox',
        options: [
            { id: 'spirits', label: 'Spirits', icon: 'Brandy.svg', selected: false },
            { id: 'wine', label: 'Wine', icon: 'Wine.svg', selected: false },
            { id: 'draught', label: 'Draught', icon: 'PintGlass.svg', selected: false },
            { id: 'cocktail', label: 'Cocktail', icon: 'Martini.svg', selected: false },
            { id: 'non-alcoholic', label: 'Non Alcoholic', icon: 'Orange.svg', selected: false },
            { id: 'mocktail', label: 'Mocktail', icon: 'Mocktails.svg', selected: false },
            { id: 'coffee', label: 'Coffee', icon: 'Coffee.svg', selected: false },
        ]
    },
    {
        id: 'food',
        title: 'Food',
        type: 'checkbox',
        options: [
            { id: 'gluten-free', label: 'Gluten free options', icon: 'mdi_food-croissant.svg', selected: false },
            { id: 'asian', label: 'Asian', icon: 'BowlFood.svg', selected: false },
            { id: 'italian', label: 'Italian', icon: 'Pizza.svg', selected: false },
            { id: 'burgers-sandwich', label: 'Burgers & Sandwich', icon: 'Hamburger.svg', selected: false },
            { id: 'north-indian', label: 'North Indian', icon: 'CookingPot.svg', selected: false },
            { id: 'bar-snacks', label: 'Bar Snacks', icon: 'Popcorn.svg', selected: false },
            { id: 'continental', label: 'Continental', icon: 'mdi_food-croissant.svg', selected: false },
            { id: 'steak', label: 'Steak', icon: 'Steak.svg', selected: false },
            { id: 'kebabs', label: 'Kebabs', icon: 'Kebabs.svg', selected: false },
            { id: 'desserts', label: 'Desserts', icon: 'Cookie.svg', selected: false },
        ]
    }
];
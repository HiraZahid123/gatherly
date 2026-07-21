export interface EventTemplate {
    id: string;
    title: string;
    previewImage: string;
    bgClass: string;
    config: {
        theme: string;
        effect: string;
        poster: string;
        vibeId: string;
    };
}

export const TEMPLATES: EventTemplate[] = [
    {
        id: "girl-dinner",
        title: "Girl Dinner",
        previewImage: "/partiful/dinner-butterflies_ywle19.avif",
        bgClass: "bg-emerald-100",
        config: {
            theme: "meadow",
            effect: "particles",
            poster: "/partiful/dinner-butterflies_ywle19.avif",
            vibeId: "fancy"
        }
    },
    {
        id: "party",
        title: "Party",
        previewImage: "/partiful/disco-pride.avif",
        bgClass: "bg-green-900",
        config: {
            theme: "streak",
            effect: "glow",
            poster: "/partiful/disco-pride.avif",
            vibeId: "digital"
        }
    },
    {
        id: "graduation",
        title: "Graduation",
        previewImage: "/partiful/awardgoesto.avif",
        bgClass: "bg-orange-100",
        config: {
            theme: "dark",
            effect: "particles",
            poster: "/partiful/awardgoesto.avif",
            vibeId: "classic"
        }
    },
    {
        id: "movie-night",
        title: "Movie Night",
        previewImage: "/partiful/movie-awards-spotlight.avif",
        bgClass: "bg-gray-900",
        config: {
            theme: "dark",
            effect: "aurora",
            poster: "/partiful/movie-awards-spotlight.avif",
            vibeId: "royal"
        }
    }
];

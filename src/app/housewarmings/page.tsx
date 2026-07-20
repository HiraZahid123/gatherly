import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";

export const metadata = {
    title: "Housewarming Invitations - Gatherly",
    description: "Create and send beautiful housewarming invitations.",
};

const templates: TemplateData[] = [
    { id: "1", label: "new digs", image: "/partiful/housewarming-muji.avif" },
    { id: "2", label: "unpacking party", image: "/partiful/retro-vday.avif" },
    { id: "3", label: "welcome home", image: "/partiful/disco-pride.avif" },
    { id: "4", label: "open house", image: "/partiful/olympics20262.avif" },
    { id: "5", label: "apartment crawl", image: "/partiful/mocktail-party.avif" },
    { id: "6", label: "house vibes", image: "/partiful/cutie-pie-blue.avif" },
];

export default function HousewarmingsPage() {
    return (
        <CategoryLandingPage 
            title="Housewarming Invitations"
            description="Skip the group texts. Share your housewarming page, track RSVPs, and keep things organized—free and easy."
            templates={templates}
        />
    );
}

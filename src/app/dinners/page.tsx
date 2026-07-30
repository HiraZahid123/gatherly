import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";

export const metadata = {
    title: "Dinner Invitations - JollyWitMe",
    description: "Create and send beautiful dinner invitations.",
};

const templates: TemplateData[] = [
    { id: "1", label: "supper club", image: "/partiful/dinner-02.avif" },
    { id: "2", label: "dumpling night", image: "/partiful/dumplingschopsticks.avif" },
    { id: "3", label: "pasta party", image: "/partiful/retro-vday.avif" },
    { id: "4", label: "taco tuesday", image: "/partiful/disco-pride.avif" },
    { id: "5", label: "fancy feast", image: "/partiful/mocktail-party.avif" },
    { id: "6", label: "pizza night", image: "/partiful/awards-night.avif" },
];

export default function DinnersPage() {
    return (
        <CategoryLandingPage 
            title="Dinner Invitations"
            description="Skip the group texts. Share your dinner page, track RSVPs, and keep things organized—free and easy."
            templates={templates}
        />
    );
}

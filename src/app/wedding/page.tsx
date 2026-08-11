import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";

export const metadata = {
    title: "Wedding Invitations & Owambe - JollyWitMe",
    description: "Create elegant wedding invitations, Owambe celebrations, and track guest RSVPs with ease.",
};

const templates: TemplateData[] = [
    { id: "1", label: "grand owambe", image: "/partiful/awards-night.avif" },
    { id: "2", label: "royal elegance", image: "/partiful/Aquarius.avif" },
    { id: "3", label: "golden vow", image: "/partiful/retro-vday.avif" },
    { id: "4", label: "white wedding", image: "/partiful/mocktail-party.avif" },
    { id: "5", label: "traditional bash", image: "/partiful/disco-pride.avif" },
    { id: "6", label: "vows & toast", image: "/partiful/cutie-pie-blue.avif" },
];

export default function WeddingPage() {
    return (
        <CategoryLandingPage 
            title="Wedding & Owambe Invitations"
            description="Plan your dream wedding or grand Owambe in style. Share custom invitations, manage guest lists, collecting dietary preferences & RSVPs seamlessly."
            templates={templates}
        />
    );
}

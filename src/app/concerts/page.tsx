import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";

export const metadata = {
    title: "Concerts & Live Events - JollyWitMe",
    description: "Create hype pages, sell tickets, and manage entry for concerts and live performances.",
};

const templates: TemplateData[] = [
    { id: "1", label: "live stage", image: "/partiful/disco-pride.avif" },
    { id: "2", label: "stadium tour", image: "/partiful/awards-night.avif" },
    { id: "3", label: "acoustic session", image: "/partiful/Aquarius.avif" },
    { id: "4", label: "fest night", image: "/partiful/bitchy-shrek-sophia.avif" },
    { id: "5", label: "after party", image: "/partiful/mocktail-party.avif" },
    { id: "6", label: "vip lounge", image: "/partiful/retro-vday.avif" },
];

export default function ConcertsPage() {
    return (
        <CategoryLandingPage 
            title="Concerts & Live Shows"
            description="Sell tickets, drop hype links, and manage door check-ins with QR codes for your concerts and live music events."
            templates={templates}
        />
    );
}

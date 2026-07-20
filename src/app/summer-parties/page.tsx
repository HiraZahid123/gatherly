import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";

export const metadata = {
    title: "Summer Party Invitations - Gatherly",
    description: "Create and send beautiful summer party invitations.",
};

const templates: TemplateData[] = [
    { id: "1", label: "on the water", image: "/partiful/Aquarius.avif" },
    { id: "2", label: "warp", image: "/partiful/disco-pride.avif" },
    { id: "3", label: "beach day", image: "/partiful/cutie-pie-blue.avif" },
    { id: "4", label: "party time", image: "/partiful/retro-vday.avif" },
    { id: "5", label: "darty", image: "/partiful/bitchy-shrek-sophia.avif" },
    { id: "6", label: "backyard bbq", image: "/partiful/awards-night.avif" },
];

export default function SummerPartiesPage() {
    return (
        <CategoryLandingPage 
            title="Summer Party Invitations"
            description="Skip the group texts. Share your party page, track RSVPs, and keep things organized—free and easy."
            templates={templates}
        />
    );
}

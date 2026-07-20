import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";

export const metadata = {
    title: "Birthday Invitations - Gatherly",
    description: "Create and send beautiful birthday invitations.",
};

const templates: TemplateData[] = [
    { id: "1", label: "surprise!", image: "/partiful/awards-night.avif" },
    { id: "2", label: "milestone", image: "/partiful/retro-vday.avif" },
    { id: "3", label: "cake time", image: "/partiful/disco-pride.avif" },
    { id: "4", label: "let's party", image: "/partiful/bitchy-shrek-sophia.avif" },
    { id: "5", label: "another year", image: "/partiful/Aquarius.avif" },
    { id: "6", label: "celebrate", image: "/partiful/cutie-pie-blue.avif" },
];

export default function BirthdaysPage() {
    return (
        <CategoryLandingPage 
            title="Birthday Invitations"
            description="Skip the group texts. Share your party page, track RSVPs, and keep things organized—free and easy."
            templates={templates}
        />
    );
}

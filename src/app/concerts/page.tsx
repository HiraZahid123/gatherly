import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";
import { getPublishedTemplatesByCategory } from "@/lib/templates";

export const metadata = {
    title: "Concerts & Live Events - JollyWitMe",
    description: "Create hype pages, sell tickets, and manage entry for concerts and live performances.",
};

export default async function ConcertsPage() {
    const templates = (await getPublishedTemplatesByCategory("Concert")).map((template) => ({
        id: template.id,
        label: template.label,
        image: template.image,
    })) as TemplateData[];

    return (
        <CategoryLandingPage 
            title="Concerts & Live Shows"
            description="Sell tickets, drop hype links, and manage door check-ins with QR codes for your concerts and live music events."
            templates={templates}
        />
    );
}

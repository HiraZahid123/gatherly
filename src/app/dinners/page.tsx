import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";
import { getPublishedTemplatesByCategory } from "@/lib/templates";

export const metadata = {
    title: "Dinner Invitations - JollyWitMe",
    description: "Create and send beautiful dinner invitations.",
};

export default async function DinnersPage() {
    const templates = (await getPublishedTemplatesByCategory("Dinner")).map((template) => ({
        id: template.id,
        label: template.label,
        image: template.image,
    })) as TemplateData[];

    return (
        <CategoryLandingPage 
            title="Dinner Invitations"
            description="Skip the group texts. Share your dinner page, track RSVPs, and keep things organized—free and easy."
            templates={templates}
        />
    );
}

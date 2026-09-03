import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";
import { getPublishedTemplatesByCategory } from "@/lib/templates";

export const metadata = {
    title: "Housewarming Invitations - JollyWitMe",
    description: "Create and send beautiful housewarming invitations.",
};

export default async function HousewarmingsPage() {
    const templates = (await getPublishedTemplatesByCategory("Housewarming")).map((template) => ({
        id: template.id,
        label: template.label,
        image: template.image,
    })) as TemplateData[];

    return (
        <CategoryLandingPage 
            title="Housewarming Invitations"
            description="Skip the group texts. Share your housewarming page, track RSVPs, and keep things organized—free and easy."
            templates={templates}
        />
    );
}

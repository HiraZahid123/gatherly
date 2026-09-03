import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";
import { getPublishedTemplatesByCategory } from "@/lib/templates";

export const metadata = {
    title: "Birthday Invitations - JollyWitMe",
    description: "Create and send beautiful birthday invitations.",
};

export default async function BirthdaysPage() {
    const templates = (await getPublishedTemplatesByCategory("Birthday")).map((template) => ({
        id: template.id,
        label: template.label,
        image: template.image,
    })) as TemplateData[];

    return (
        <CategoryLandingPage 
            title="Birthday Invitations"
            description="Skip the group texts. Share your party page, track RSVPs, and keep things organized—free and easy."
            templates={templates}
        />
    );
}

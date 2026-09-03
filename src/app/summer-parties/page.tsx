import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";
import { getPublishedTemplatesByCategory } from "@/lib/templates";

export const metadata = {
    title: "Summer Party Invitations - JollyWitMe",
    description: "Create and send beautiful summer party invitations.",
};

export default async function SummerPartiesPage() {
    const templates = (await getPublishedTemplatesByCategory("Party")).map((template) => ({
        id: template.id,
        label: template.label,
        image: template.image,
    })) as TemplateData[];

    return (
        <CategoryLandingPage 
            title="Summer Party Invitations"
            description="Skip the group texts. Share your party page, track RSVPs, and keep things organized—free and easy."
            templates={templates}
        />
    );
}

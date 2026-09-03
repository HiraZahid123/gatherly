import CategoryLandingPage, { TemplateData } from "@/components/CategoryLandingPage";
import { getPublishedTemplatesByCategory } from "@/lib/templates";

export const metadata = {
    title: "Wedding Invitations & Owambe - JollyWitMe",
    description: "Create elegant wedding invitations, Owambe celebrations, and track guest RSVPs with ease.",
};

export default async function WeddingPage() {
    const templates = (await getPublishedTemplatesByCategory("Wedding")).map((template) => ({
        id: template.id,
        label: template.label,
        image: template.image,
    })) as TemplateData[];

    return (
        <CategoryLandingPage 
            title="Wedding & Owambe Invitations"
            description="Plan your dream wedding or grand Owambe in style. Share custom invitations, manage guest lists, collecting dietary preferences & RSVPs seamlessly."
            templates={templates}
        />
    );
}

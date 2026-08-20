"use client";

import React, { useEffect, useState, use } from "react";
import TemplateForm, { TemplateData } from "../../TemplateForm";

interface EditTemplatePageProps {
    params: Promise<{ id: string }>;
}

export default function EditTemplatePage({ params }: EditTemplatePageProps) {
    const { id } = use(params);
    const [template, setTemplate] = useState<TemplateData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const res = await fetch(`/api/admin/templates/${id}`);
                const data = await res.json();
                if (data.success && data.template) {
                    setTemplate(data.template);
                } else {
                    setError(data.error || "Failed to load template");
                }
            } catch (err) {
                setError("An error occurred while loading template");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchTemplate();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="py-24 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm">Loading template...</p>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="p-8 text-center bg-[#111113] border border-red-500/20 rounded-3xl text-red-400">
                <p>{error || "Template not found"}</p>
            </div>
        );
    }

    return <TemplateForm initialData={template} isEditing={true} />;
}

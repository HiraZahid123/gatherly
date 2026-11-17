"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

interface CreateEventButtonProps {
    className?: string;
    children?: React.ReactNode;
}

export default function CreateEventButton({
    className = "bg-white text-brand-green font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300",
    children = "Create Event",
}: CreateEventButtonProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const targetUrl = session?.user
        ? "/events/create"
        : "/auth/signin?callbackUrl=/events/create";

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        router.push(targetUrl);
    };

    return (
        <Link
            href={targetUrl}
            onClick={handleClick}
            className={className}
        >
            {children}
        </Link>
    );
}

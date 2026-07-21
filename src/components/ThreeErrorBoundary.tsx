"use client";

import React from "react";

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ThreeErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        // Only log in dev, don't surface to user
        if (process.env.NODE_ENV === "development") {
            console.warn("[ThreeErrorBoundary] Caught Three.js error:", error.message);
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}

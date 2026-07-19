"use client";

import React, { Component } from "react";
import dynamic from "next/dynamic";

const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then(mod => mod.Player), { ssr: false });

interface Props {
    src: string;
    autoplay?: boolean;
    loop?: boolean;
    hover?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

interface State {
    hasError: boolean;
}

export default class SafeLottiePlayer extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Lottie Player crashed:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div 
                    className={`flex items-center justify-center bg-black/20 text-white/40 text-[10px] font-bold uppercase tracking-widest text-center ${this.props.className || ""}`}
                    style={this.props.style}
                >
                    <span className="opacity-50">Unavailable</span>
                </div>
            );
        }

        return <Player {...this.props} />;
    }
}

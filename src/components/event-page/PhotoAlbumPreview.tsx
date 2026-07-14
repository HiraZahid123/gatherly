import React from "react";
import { Camera, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

export default function PhotoAlbumPreview() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Photo Album</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-bold transition-all">
                    <LinkIcon className="w-3 h-3" />
                    Copy link
                </button>
            </div>

            <div className="flex gap-4">
                <button className="flex-1 h-32 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2 group">
                    <Camera className="w-8 h-8 text-white/40 group-hover:text-white transition-colors" />
                    <span className="text-sm font-bold text-white/60 group-hover:text-white">Camera</span>
                </button>
                <button className="flex-1 h-32 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2 group">
                    <ImageIcon className="w-8 h-8 text-white/40 group-hover:text-white transition-colors" />
                    <span className="text-sm font-bold text-white/60 group-hover:text-white">Upload</span>
                </button>
            </div>
        </div>
    );
}

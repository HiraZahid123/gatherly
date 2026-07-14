"use client";

import { useState, useRef } from "react";
import { X, Upload, Check, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { compressImage } from "@/lib/compressImage";

interface CoverImageGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (imageUrl: string) => void;
    currentImage?: string;
}

const PARTIFUL_IMAGES = [
    { id: "aquarius", url: "/api/partiful/Aquarius.avif", label: "Aquarius" },
    { id: "back-to-school", url: "/api/partiful/Back to School S.avif", label: "Back to School" },
    { id: "devil-heart", url: "/api/partiful/Devil Heart.avif", label: "Devil Heart" },
    { id: "lady-gaga", url: "/api/partiful/adminnightladygaga.avif", label: "Lady Gaga" },
    { id: "aquarius-cake", url: "/api/partiful/aquarius-baby-cake.avif", label: "Aquarius Cake" },
    { id: "aquarius-airbrush", url: "/api/partiful/aquariusairbrush.avif", label: "Aquarius Airbrush" },
    { id: "award-goes-to", url: "/api/partiful/awardgoesto.avif", label: "Award Goes To" },
    { id: "awards-night", url: "/api/partiful/awards-night.avif", label: "Awards Night" },
    { id: "bad-bunny-award", url: "/api/partiful/badbunnyaward.avif", label: "Bad Bunny Award" },
    { id: "bad-bunny-debi", url: "/api/partiful/badbunnydebitirar.avif", label: "Bad Bunny" },
    { id: "bday-copypasta", url: "/api/partiful/bday-copypasta-1.avif", label: "Birthday Copypasta" },
    { id: "bitchy-shrek", url: "/api/partiful/bitchy-shrek-sophia.avif", label: "Bitchy Shrek" },
    { id: "bowtie-invite", url: "/api/partiful/bowtie-invite.avif", label: "Bowtie Invite" },
    { id: "bridgerton", url: "/api/partiful/bridgerton-two.avif", label: "Bridgerton" },
    { id: "brunch-oclock", url: "/api/partiful/brunch-oclock.avif", label: "Brunch O'clock" },
    { id: "calisober", url: "/api/partiful/calisober-soft.avif", label: "Calisober" },
    { id: "capricorn-cake", url: "/api/partiful/capricorn-baby-cake.avif", label: "Capricorn Cake" },
    { id: "chocolatebox", url: "/api/partiful/chocolatebox.avif", label: "Chocolate Box" },
    { id: "come-hang", url: "/api/partiful/come-hang-club-penguin.avif", label: "Club Penguin" },
    { id: "cozy-bear", url: "/api/partiful/cozy-chill-bear.avif", label: "Cozy Bear" },
    { id: "crafts-collage", url: "/api/partiful/crafts-collage.avif", label: "Crafts Collage" },
    { id: "cutie-pie", url: "/api/partiful/cutie-pie-blue.avif", label: "Cutie Pie" },
    { id: "dapitt", url: "/api/partiful/dapitt.avif", label: "Dapitt" },
    { id: "dinner-02", url: "/api/partiful/dinner-02.avif", label: "Dinner" },
    { id: "dinner-butterflies", url: "/api/partiful/dinner-butterflies_ywle19.avif", label: "Dinner Butterflies" },
    { id: "disco-pride", url: "/api/partiful/disco-pride.avif", label: "Disco Pride" },
    { id: "matcha", url: "/api/partiful/drinkgradient-matcha.avif", label: "Matcha" },
    { id: "dump-him", url: "/api/partiful/dump-him.avif", label: "Dump Him" },
    { id: "dumplings", url: "/api/partiful/dumplingschopsticks.avif", label: "Dumplings" },
    { id: "galentines-type", url: "/api/partiful/galentines-day-type.avif", label: "Galentine's" },
    { id: "galentines-party", url: "/api/partiful/galentines-party.avif", label: "Galentine's Party" },
    { id: "galentines-cheetah", url: "/api/partiful/galentinescheetah.avif", label: "Galentine's Cheetah" },
    { id: "galentines-pink", url: "/api/partiful/galentinescheetahpink.avif", label: "Galentine's Pink" },
    { id: "galentines-curtain", url: "/api/partiful/galentinescurtain.avif", label: "Galentine's Curtain" },
    { id: "halftime", url: "/api/partiful/halftime-just.avif", label: "Halftime" },
    { id: "harry-styles", url: "/api/partiful/harrystylesdisco.avif", label: "Harry Styles" },
    { id: "football", url: "/api/partiful/have-fun-football.avif", label: "Football" },
    { id: "heartbreak-hotel", url: "/api/partiful/heartbreak-hotel.avif", label: "Heartbreak Hotel" },
    { id: "hearts-crafts", url: "/api/partiful/hearts-and-crafts.avif", label: "Hearts & Crafts" },
    { id: "heated-rivalry", url: "/api/partiful/heatedrivalryheart3.avif", label: "Heated Rivalry" },
    { id: "housewarming", url: "/api/partiful/housewarming-muji.avif", label: "Housewarming" },
    { id: "hypnotic-vday", url: "/api/partiful/hypnotic-vday.avif", label: "Hypnotic Vday" },
    { id: "iheartme", url: "/api/partiful/iheartme-nyc.avif", label: "I Heart Me" },
    { id: "lets-climb", url: "/api/partiful/lets-climb.avif", label: "Let's Climb" },
    { id: "love-is-blind", url: "/api/partiful/love-is-blind-wild.avif", label: "Love Is Blind" },
    { id: "love-potion", url: "/api/partiful/love-potion.avif", label: "Love Potion" },
    { id: "lunar-new-year", url: "/api/partiful/lunarnewyear2026.avif", label: "Lunar New Year" },
    { id: "mocktail", url: "/api/partiful/mocktail-party.avif", label: "Mocktail Party" },
    { id: "movie-awards", url: "/api/partiful/movie-awards-spotlight.avif", label: "Movie Awards" },
    { id: "nicole-kidman", url: "/api/partiful/nicole-kidman-divorce.avif", label: "Nicole Kidman" },
    { id: "office-afters", url: "/api/partiful/office-afters.avif", label: "Office Afters" },
    { id: "olympics", url: "/api/partiful/olympics20262.avif", label: "Olympics" },
    { id: "bad-bunny-boss", url: "/api/partiful/onlythingmorepowerfulbadbunny.avif", label: "Bad Bunny Boss" },
    { id: "oscar-watch", url: "/api/partiful/oscar-watch-party-star.avif", label: "Oscar Night" },
    { id: "pingu", url: "/api/partiful/pingu-valentine.avif", label: "Pingu Valentine" },
    { id: "rehearsal-dinner", url: "/api/partiful/rehearsal-dinner.avif", label: "Rehearsal Dinner" },
    { id: "resolutions", url: "/api/partiful/resolutionbuttonss.avif", label: "Resolutions" },
    { id: "retro-vday", url: "/api/partiful/retro-vday.avif", label: "Retro Vday" },
    { id: "spongebob", url: "/api/partiful/spongebob-pie_el98lq.avif", label: "Spongebob" },
    { id: "lofi-study", url: "/api/partiful/study-break-lofi.avif", label: "Lofi Study" },
    { id: "turkey", url: "/api/partiful/turkey-notext.avif", label: "Turkey" },
    { id: "cupid", url: "/api/partiful/valentine-cupid.avif", label: "Cupid" },
    { id: "horror-valentine", url: "/api/partiful/valentine-horror.avif", label: "Horror Valentine" },
    { id: "valentines-cake", url: "/api/partiful/valentinescake.avif", label: "Valentine's Cake" },
    { id: "valentines-curtains", url: "/api/partiful/valentinesdaycurtains.avif", label: "Valentine's Curtains" },
    { id: "wingmeme", url: "/api/partiful/wingmemenature.avif", label: "Wing Meme" }
];

export default function CoverImageGallery({ isOpen, onClose, onSelect, currentImage }: CoverImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string>(currentImage || "");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");
        setUploading(true);

        let uploadFile = file;
        try {
            uploadFile = await compressImage(file, { maxWidth: 1920, maxHeight: 1920 });
        } catch {
            // compression failed — fall back to original
        }

        const formData = new FormData();
        formData.append("file", uploadFile);

        try {
            const response = await fetch("/api/upload/cover", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setSelectedImage(data.imageUrl);
            onSelect(data.imageUrl);
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An error occurred while uploading";
            setError(message);
        } finally {
            setUploading(false);
        }
    };

    const handleSelectImage = (url: string) => {
        setSelectedImage(url);
    };

    const handleConfirm = () => {
        if (selectedImage) {
            onSelect(selectedImage);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl bg-black/40 border border-white/10 rounded-none overflow-hidden shadow-[0_60px_100px_-30px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Choose Cover Image</h3>
                        <p className="text-[11px] text-white/40 font-bold">Select a theme image or upload your own</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-none transition-colors"
                    >
                        <X className="w-5 h-5 text-white/40" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-none text-red-500 text-xs font-bold">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {/* Upload Button */}
                        <div
                            className="aspect-square rounded-none border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 relative overflow-hidden group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Upload</span>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                        </div>

                        {/* Partiful Images */}
                        {PARTIFUL_IMAGES.map((img) => (
                            <div
                                key={img.id}
                                className={`aspect-square rounded-none overflow-hidden relative group cursor-pointer border transition-all ${selectedImage === img.url ? "border-white" : "border-white/5 hover:border-white/20"
                                    }`}
                                onClick={() => handleSelectImage(img.url)}
                            >
                                <Image
                                    src={img.url}
                                    alt={img.label}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                                />

                                {selectedImage === img.url && (
                                    <div className="absolute top-2 right-2 bg-white text-black p-0.5">
                                        <Check className="w-2.5 h-2.5" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-white/20">
                        <ImageIcon className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Selected Image Preview</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedImage || uploading}
                            className="px-8 py-3 bg-white text-black rounded-none text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            Select Image
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

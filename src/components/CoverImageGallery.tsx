"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Check, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { compressImage } from "@/lib/compressImage";
import ImagePositionAdjuster from "@/components/ui/ImagePositionAdjuster";

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

interface CoverTemplateDisplay {
    id: string;
    url: string;
    title: string;
    category?: string;
}

export default function CoverImageGallery({ isOpen, onClose, onSelect, currentImage }: CoverImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string>(currentImage || "");
    const [templates, setTemplates] = useState<CoverTemplateDisplay[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [adjustingFile, setAdjustingFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setIsLoadingTemplates(true);
        fetch("/api/cover-templates")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.templates) && data.templates.length > 0) {
                    setTemplates(
                        data.templates.map((t: any) => ({
                            id: t.id,
                            url: t.url,
                            title: t.title,
                            category: t.category,
                        }))
                    );
                } else {
                    setTemplates(PARTIFUL_IMAGES.map((p) => ({ id: p.id, url: p.url, title: p.label })));
                }
            })
            .catch(() => {
                setTemplates(PARTIFUL_IMAGES.map((p) => ({ id: p.id, url: p.url, title: p.label })));
            })
            .finally(() => setIsLoadingTemplates(false));
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAdjustingFile(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleAdjusterConfirm = async (adjustedFile: File) => {
        setAdjustingFile(null);
        setError("");
        setUploading(true);

        let uploadFile = adjustedFile;
        try {
            uploadFile = await compressImage(adjustedFile, { maxWidth: 1920, maxHeight: 1920 });
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

            const responseText = await response.text();
            let data: any;
            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(response.status === 413 ? "Image is too large. Please choose a smaller image." : "Image upload failed. Please try again.");
            }

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
        if (selectedImage === url) {
            // Tapping an already selected image immediately confirms it
            onSelect(url);
            onClose();
            return;
        }
        setSelectedImage(url);
    };

    const handleConfirm = () => {
        if (selectedImage) {
            onSelect(selectedImage);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl h-[90dvh] sm:h-[85vh] max-h-[850px] bg-[#0c0c10] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 flex flex-col">
                {/* Header */}
                <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0c0c10] z-10">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Choose Cover Image</h3>
                        <p className="text-[11px] text-white/40 font-medium">Select a theme image or upload your own</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 overscroll-contain">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-4">
                        {/* Upload Button */}
                        <div
                            className="aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 relative overflow-hidden group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <Upload className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="text-[11px] font-bold tracking-wider text-white/60 group-hover:text-white transition-colors">Upload</span>
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

                        {/* Cover Templates */}
                        {templates.map((img) => {
                            const isSelected = selectedImage === img.url;
                            return (
                                <div
                                    key={img.id}
                                    className={`aspect-square rounded-xl overflow-hidden relative group cursor-pointer border-2 transition-all ${
                                        isSelected 
                                            ? "border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg scale-[0.98]" 
                                            : "border-white/10 hover:border-white/30"
                                    }`}
                                    onClick={() => handleSelectImage(img.url)}
                                    onDoubleClick={() => {
                                        onSelect(img.url);
                                        onClose();
                                    }}
                                >
                                    <Image
                                        src={img.url}
                                        alt={img.title || "Cover"}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized={img.url.startsWith("/uploads/")}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                                    <span className="absolute bottom-2 inset-x-2 text-[10px] sm:text-xs font-bold text-white truncate drop-shadow">
                                        {img.title}
                                    </span>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-emerald-500 text-black p-1 rounded-full shadow-lg">
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sticky Footer - Always visible on mobile and desktop without scrolling */}
                <div className="shrink-0 sticky bottom-0 z-20 px-4 sm:px-6 py-3.5 border-t border-white/10 bg-[#0c0c10]/98 backdrop-blur-xl flex items-center justify-between gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {selectedImage ? (
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/20 shrink-0">
                                <Image
                                    src={selectedImage}
                                    alt="Selected"
                                    fill
                                    className="object-cover"
                                    unoptimized={selectedImage.startsWith("/uploads/")}
                                />
                            </div>
                        ) : (
                            <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-4 h-4 text-white/30" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <span className="text-[11px] font-bold text-white block truncate">
                                {selectedImage ? "Template Selected" : "Tap an image to choose"}
                            </span>
                            <span className="text-[9px] text-white/40 block">
                                {selectedImage ? "Tap again or click Select" : "Browse gallery above"}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={onClose}
                            className="px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedImage || uploading}
                            className="px-5 sm:px-7 py-2.5 bg-white text-black hover:bg-white/90 rounded-xl text-xs font-black shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
                        >
                            Select Image
                        </button>
                    </div>
                </div>
            </div>

            {adjustingFile && (
                <ImagePositionAdjuster
                    file={adjustingFile}
                    onConfirm={handleAdjusterConfirm}
                    onCancel={() => setAdjustingFile(null)}
                />
            )}
        </div>
    );
}

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import FeaturesSection from "@/components/FeaturesSection";
import TextBlastSection from "@/components/TextBlastSection";
import InteractiveShowcase from "@/components/InteractiveShowcase";
import CompanyReviews from "@/components/CompanyReviews";
import TrendingTemplates from "@/components/TrendingTemplates";
import CustomerReviews from "@/components/CustomerReviews";
import BlogSection from "@/components/BlogSection";

export default function Home() {
  return (
    <main className="relative w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-center">
        {/* Background Media */}
        <div className="absolute inset-0 z-0">
          <video
            src="/nigeria.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="object-cover w-full h-full"
          />
          {/* Custom gradient overlay to match the new green theme */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-green-800 to-emerald-900 opacity-80 mix-blend-multiply"></div>
          {/* Additional overlay for specific localized brightness adjustments */}
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 to-transparent mix-blend-overlay"></div>
        </div>

        {/* Content Container */}
        <div className="container relative z-10 mx-auto px-6 py-12 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full pt-24">
          {/* Left Column (Text Content) */}
          <div className="flex flex-col space-y-8 max-w-2xl">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[0.95] tracking-tight text-white drop-shadow-lg">
              Create events <br /> people actually <br /> show up for.
            </h1>
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/90 font-normal max-w-lg leading-relaxed drop-shadow-md">
              Beautiful invitations. Instant RSVPs. Guest chat. Event updates. All in one place.
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/auth/signup"
                className="bg-white text-brand-green font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300"
              >
                Create Event
              </Link>
              <Link
                href="/events"
                className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-full hover:bg-white/10 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                View Example
              </Link>
            </div>
          </div>

          {/* Right Column (Visual Elements / Glassmorphism Cards) */}
          <div className="relative h-[500px] w-full hidden lg:block perspective-1000">
            {/* Card 1: Event Invite (Back/Left) */}
            <div className="glass-card absolute top-10 left-0 w-80 p-6 rounded-3xl animate-[float_6s_ease-in-out_infinite] transform -rotate-6 z-10">
              {/* Card Header */}
              <div className="mb-4">
                <h3 className="text-black font-bold text-lg mb-1">Grand Owambe Invite</h3>
                <p className="text-gray-800 text-xs font-medium">
                  Chief &amp; Chief Mrs. Balogun&apos;s 50th Owambe
                </p>
              </div>
              {/* Event Details */}
              <div className="space-y-1 mb-6">
                <p className="text-gray-900 text-xs font-semibold">Sat, 5:00 PM • Victoria Island, Lagos</p>
                <p className="text-gray-900 text-xs">Dress Code: Emerald &amp; Gold Aso-Ebi</p>
              </div>
              {/* Card Buttons */}
              <div className="flex gap-3 mt-2">
                <button type="button" className="flex-1 bg-white text-black text-xs font-bold py-2 rounded-full shadow-sm hover:shadow-md transition">
                  RSVP
                </button>
                <button type="button" className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold py-2 rounded-full shadow-sm hover:shadow-md transition">
                  RSVP
                </button>
              </div>
            </div>

            {/* Card 2: Guest List (Front/Right) */}
            <div className="glass-card absolute top-20 right-10 w-64 p-5 rounded-3xl animate-[float_7s_ease-in-out_infinite_1s] z-30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-black font-bold text-lg">Guest List</h3>
              </div>
              {/* Avatar Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  {
                    name: "Ola",
                    img: "/assets/b-2.webp",
                  },
                  {
                    name: "Semilore",
                    img: "/assets/g-1.avif",
                  },
                  {
                    name: "Babatunde",
                    img: "/assets/b-3.webp",
                  },
                  {
                    name: "Ifeoma",
                    img: "/assets/g-2.avif",
                  },
                  {
                    name: "Shegzy",
                    img: "/assets/b-4.webp",
                  },
                ].map((guest, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm border border-white/20">
                      <Image
                        src={guest.img}
                        alt={guest.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <span className="text-[9px] text-gray-900 mt-1 leading-tight font-medium">
                      {guest.name}
                    </span>
                  </div>
                ))}
                <div className="flex flex-col items-center">
                  <button type="button" aria-label="Add guest" className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 bg-white/20 hover:bg-white/40 transition">
                    <Plus size={16} />
                  </button>
                  <span className="text-[9px] text-gray-900 mt-1 font-medium">
                    Chigozie
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-20 w-3 h-6 bg-yellow-400 rotate-45 opacity-80 blur-[1px]"></div>
            <div className="absolute bottom-10 left-10 w-4 h-4 bg-emerald-400 rounded-full opacity-70 blur-[1px]"></div>
            <div className="absolute top-1/2 left-1/4 w-3 h-8 bg-green-500 -rotate-12 opacity-60 blur-[1px]"></div>
            <div className="absolute top-10 right-10 w-2 h-4 bg-yellow-400 rotate-12 opacity-80"></div>
            <div className="absolute top-40 right-1/4 w-3 h-3 bg-emerald-300 rounded-full opacity-70"></div>
            <div className="absolute bottom-20 left-20 w-2 h-6 bg-green-400 rotate-45 opacity-60"></div>
            <div className="absolute top-1/2 right-0 w-4 h-2 bg-yellow-500 -rotate-12 opacity-80"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Interactive Showcase Section */}
      <InteractiveShowcase />

      {/* Trending Templates Slider */}
      <TrendingTemplates />

      {/* Text Blast Section */}
      <TextBlastSection />

      {/* Customer Reviews */}
      <CustomerReviews />

      {/* Company Reviews / Press Marquee */}
      <CompanyReviews />

      {/* Blog Section */}
      <BlogSection />
    </main>
  );
}

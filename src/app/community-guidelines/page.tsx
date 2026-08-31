import Link from "next/link";
import {
    HeartHandshake,
    Shield,
    Lock,
    Eye,
    Users,
    MessageSquare,
    Sparkles,
    Camera,
    Flag,
    AlertTriangle,
    CheckCircle2,
    ArrowLeft,
    HelpCircle,
    Mail,
} from "lucide-react";

export const metadata = {
    title: "Community Guidelines | JollyWitMe",
    description:
        "Learn about the standards and guidelines expected from everyone using JollyWitMe to keep events respectful, safe, and lawful.",
};

const GUIDELINE_SECTIONS = [
    {
        num: "01",
        title: "Be Respectful",
        icon: HeartHandshake,
        description:
            "Treat all users, guests, event hosts, and community members with respect.",
        encourages: [
            "Positive conversations",
            "Constructive feedback",
            "Friendly interactions",
            "Inclusive participation",
        ],
        prohibits: [
            "Bullying",
            "Harassment",
            "Intimidation",
            "Threats",
            "Personal attacks",
            "Abusive language",
        ],
    },
    {
        num: "02",
        title: "Keep Events Safe and Lawful",
        icon: Shield,
        description:
            "You may only create and promote events that comply with applicable laws and regulations. Event information must be truthful and accurate.",
        prohibitsTitle: "Do not use JollyWitMe to promote or organize:",
        prohibits: [
            "Illegal activities",
            "Fraudulent schemes",
            "Dangerous activities",
            "Unauthorized ticket sales",
            "Misleading or deceptive events",
        ],
    },
    {
        num: "03",
        title: "Respect Privacy",
        icon: Lock,
        description:
            "Protect your own privacy and the privacy of others. Hosts should only upload guest information that they have permission to use.",
        prohibitsTitle: "Strictly Prohibited:",
        prohibits: [
            "Sharing private contact information without permission",
            "Uploading confidential information",
            "Publishing personal data belonging to others",
            "Impersonating another individual or organization",
        ],
    },
    {
        num: "04",
        title: "Appropriate Content",
        icon: Eye,
        description:
            "Content shared on JollyWitMe should be suitable for a broad audience and consistent with the purpose of event planning and social gatherings. We reserve the right to remove any content that we consider inappropriate or harmful.",
        prohibitsTitle: "Do not post content that:",
        prohibits: [
            "Is obscene or offensive",
            "Contains graphic violence",
            "Promotes hate or discrimination",
            "Encourages harmful behavior",
            "Contains malicious links or software",
            "Violates intellectual property rights",
        ],
    },
    {
        num: "05",
        title: "Authentic Participation",
        icon: Users,
        description:
            "Help maintain a trusted community. Users should interact honestly and transparently.",
        prohibitsTitle: "Do not:",
        prohibits: [
            "Create fake accounts",
            "Misrepresent your identity",
            "Manipulate RSVP counts",
            "Generate fake reviews or testimonials",
            "Artificially inflate event engagement",
        ],
    },
    {
        num: "06",
        title: "Guest Communication",
        icon: MessageSquare,
        description:
            "Use event messaging responsibly. Repeated abuse of communication tools may result in account restrictions.",
        encouragesTitle: "You may:",
        encourages: [
            "Send legitimate event updates",
            "Notify guests of schedule changes",
            "Share event-related information",
        ],
        prohibitsTitle: "You may not:",
        prohibits: [
            "Spam guests",
            "Send excessive messages",
            "Promote unrelated products or services",
            "Engage in unwanted solicitation",
        ],
    },
    {
        num: "07",
        title: "Intellectual Property",
        icon: Sparkles,
        description:
            "Only upload content you own or have permission to use, including Photos, Videos, Music, Logos, Graphics, and Event artwork. If you believe your intellectual property rights have been infringed, please contact us with details of the alleged infringement.",
    },
    {
        num: "08",
        title: "Event Photos and Media",
        icon: Camera,
        description:
            "Many events involve sharing photos and videos. Before uploading content featuring other people, ensure you have appropriate permission where required.",
        prohibitsTitle: "Do not upload media that:",
        prohibits: [
            "Violates someone's privacy",
            "Is misleading or manipulated to harm another person",
            "Infringes copyright or ownership rights",
        ],
    },
    {
        num: "09",
        title: "Reporting Problems",
        icon: Flag,
        description:
            "If you encounter content or behaviour that violates these Guidelines, please report it through the Platform or contact our support team. We review reports and take action where appropriate.",
        encouragesTitle: "Reports may include:",
        encourages: [
            "Harassment or bullying",
            "Fraud or fake ticketing",
            "Spam and phishing",
            "Impersonation",
            "Copyright concerns",
            "Physical or digital safety issues",
        ],
    },
    {
        num: "10",
        title: "Enforcement",
        icon: Shield,
        description:
            "To protect our community, JollyWitMe may take action against accounts or content that violate these Guidelines. Enforcement decisions are made at JollyWitMe's sole discretion.",
        encouragesTitle: "Actions may include:",
        encourages: [
            "Content removal",
            "Event removal",
            "Temporary account suspension",
            "Permanent account termination",
            "Restriction of platform features",
        ],
    },
    {
        num: "11",
        title: "Repeat Violations",
        icon: AlertTriangle,
        description:
            "Users who repeatedly violate these Guidelines may lose access to some or all Platform features. Serious violations may result in immediate account termination without prior warning.",
    },
];

export default function CommunityGuidelinesPage() {
    return (
        <main className="min-h-screen bg-[#070709] text-white selection:bg-emerald-500/30 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[160px] rounded-full" />
                <div className="absolute top-[40%] right-[-10%] w-[45%] h-[45%] bg-teal-600/10 blur-[180px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-green-600/5 blur-[160px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 pt-28 pb-24 relative z-10 max-w-5xl">
                {/* Back Button */}
                <div className="mb-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Home</span>
                    </Link>
                </div>

                {/* Hero Header */}
                <div className="space-y-4 mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <HeartHandshake className="w-3.5 h-3.5" />
                        Community Standards
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                        Community{" "}
                        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
                            Guidelines
                        </span>
                    </h1>
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                        <span>Last Updated: 28 Aug 2026</span>
                        <span>•</span>
                        <span className="text-emerald-400">Official Policy</span>
                    </div>
                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl pt-2">
                        At JollyWitMe, we're building a platform that helps people create memorable events, connect with guests, and celebrate life's special moments. These Community Guidelines explain the standards expected from everyone using the platform.
                    </p>
                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-gray-400 max-w-2xl">
                        By accessing or using JollyWitMe, you agree to follow and uphold these guidelines for all events, messages, media, and guest interactions.
                    </div>
                </div>

                {/* Guidelines Grid / List */}
                <div className="space-y-8">
                    {GUIDELINE_SECTIONS.map((section) => {
                        const Icon = section.icon;
                        return (
                            <section
                                key={section.num}
                                className="bg-[#111114]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-emerald-500/30 transition-all shadow-xl space-y-5"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                            {section.num}. {section.title}
                                        </h2>
                                    </div>
                                    <span className="text-xs font-mono text-gray-500 font-bold">
                                        Section {section.num}
                                    </span>
                                </div>

                                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                    {section.description}
                                </p>

                                {(section.encourages || section.prohibits) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        {section.encourages && (
                                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                                                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {section.encouragesTitle || "We encourage:"}
                                                </h3>
                                                <ul className="space-y-2">
                                                    {section.encourages.map((item, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="text-xs sm:text-sm text-gray-300 flex items-start gap-2"
                                                        >
                                                            <span className="text-emerald-400 font-bold">•</span>
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {section.prohibits && (
                                            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 space-y-3">
                                                <h3 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {section.prohibitsTitle || "We do not tolerate:"}
                                                </h3>
                                                <ul className="space-y-2">
                                                    {section.prohibits.map((item, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="text-xs sm:text-sm text-gray-300 flex items-start gap-2"
                                                        >
                                                            <span className="text-red-400 font-bold">•</span>
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>
                        );
                    })}

                    {/* Section 12: Community Philosophy Highlight Card */}
                    <section className="bg-gradient-to-br from-emerald-950/40 via-[#111114] to-[#111114] border border-emerald-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-white">
                                    12. Our Community Philosophy
                                </h2>
                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                                    Guiding Principles for Every Gathering
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                            JollyWitMe exists to help people celebrate, connect, and create memorable experiences. Before creating an event or posting content, ask yourself:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                                "Is it respectful?",
                                "Is it truthful?",
                                "Is it helpful?",
                                "Is it lawful?",
                                "Would I be comfortable receiving this content myself?",
                            ].map((question, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center gap-3"
                                >
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black flex-shrink-0">
                                        ✓
                                    </span>
                                    <span>{question}</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm font-semibold text-emerald-300 pt-2">
                            If the answer is yes, you're contributing positively to the JollyWitMe community.
                        </p>
                    </section>
                </div>

                {/* Footer Help Card */}
                <div className="mt-16 p-8 bg-[#111114] border border-white/10 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center sm:text-left">
                        <h3 className="font-bold text-lg text-white">Need to report a violation?</h3>
                        <p className="text-xs text-gray-400">
                            Our Trust & Safety team is available 24/7 to review content and protect your safety.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/contact"
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Contact Support</span>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

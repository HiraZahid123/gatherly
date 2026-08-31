import Link from "next/link";
import {
    FileCheck2,
    Shield,
    Users,
    Key,
    Sparkles,
    Ban,
    MessageSquare,
    Contact,
    Cpu,
    Award,
    ThumbsUp,
    Layers,
    Lock,
    Activity,
    AlertOctagon,
    Scale,
    UserX,
    RefreshCw,
    Gavel,
    Mail,
    ArrowLeft,
} from "lucide-react";

export const metadata = {
    title: "Terms of Service | JollyWitMe",
    description:
        "Review the Terms of Service governing your access to and use of the JollyWitMe website, applications, event creation, and guest management tools.",
};

const TERMS_SECTIONS = [
    {
        num: "01",
        title: "About JollyWitMe",
        icon: Sparkles,
        body: "JollyWitMe is a platform that allows users to create, manage, share, and participate in events, including but not limited to weddings, birthdays, housewarming parties, concerts, social gatherings, and other event-related activities.",
    },
    {
        num: "02",
        title: "Eligibility",
        icon: Users,
        body: `You must be at least 18 years old, or the age of legal majority in your jurisdiction, to create an account and use the Platform.
By using the Platform, you represent and warrant that:
• You have the legal capacity to enter into these Terms.
• The information you provide is accurate and current.
• You will comply with all applicable laws and regulations.`,
    },
    {
        num: "03",
        title: "User Accounts",
        icon: Key,
        body: `To access certain features, you may be required to create an account. You agree to:
• Keep your login credentials secure.
• Maintain accurate account information.
• Notify us immediately of unauthorized use of your account.

You are responsible for all activities conducted through your account. We reserve the right to suspend or terminate accounts that violate these Terms.`,
    },
    {
        num: "04",
        title: "Event Creation and User Content",
        icon: Sparkles,
        body: `You retain ownership of any content you submit, upload, or publish through the Platform, including event information, images, videos, guest lists, messages, comments, announcements, and other user-generated content.
By posting content on JollyWitMe, you grant us a worldwide, non-exclusive, royalty-free license to host, store, reproduce, display, and distribute such content solely for the purpose of operating and improving the Platform. You are solely responsible for the content you publish.`,
    },
    {
        num: "05",
        title: "Prohibited Content",
        icon: Ban,
        body: `You agree not to post or distribute content that:
• Is unlawful, fraudulent, misleading, or deceptive
• Infringes intellectual property rights
• Contains viruses, malware, or harmful code
• Promotes violence or illegal activity
• Harasses, threatens, or abuses others
• Contains hate speech or discriminatory content
• Violates the privacy rights of another individual

We reserve the right to remove content that violates these Terms without notice.`,
    },
    {
        num: "06",
        title: "Guest Communications",
        icon: MessageSquare,
        body: `The Platform may allow users to send invitations, updates, reminders, announcements, and communications to guests. You agree that:
• You will only communicate with individuals who have a legitimate relationship to your event.
• You will not use the Platform for spam, unsolicited marketing, or mass advertising.
• You are responsible for compliance with applicable communication and privacy laws.`,
    },
    {
        num: "07",
        title: "Guest Lists and Contact Information",
        icon: Contact,
        body: `If you upload guest information, including names, email addresses, or telephone numbers, you represent that:
• You have the right to use that information.
• You have obtained any permissions required by law.
• The information is accurate to the best of your knowledge.
We process such information in accordance with our Privacy Policy.`,
    },
    {
        num: "08",
        title: "Acceptable Use",
        icon: Cpu,
        body: `You agree not to:
• Interfere with Platform operations
• Attempt unauthorized access to accounts or systems
• Scrape, copy, or harvest Platform data
• Reverse engineer or exploit the Platform
• Circumvent security measures
• Use automated bots without our written permission`,
    },
    {
        num: "09",
        title: "Intellectual Property",
        icon: Award,
        body: `The Platform, including its design, branding, logos, software, and content provided by JollyWitMe, is owned by or licensed to JollyWitMe and is protected by intellectual property laws.
You may not copy, modify, distribute, sell, license, or reproduce any part of the Platform without prior written permission.`,
    },
    {
        num: "10",
        title: "Feedback",
        icon: ThumbsUp,
        body: "If you provide suggestions, ideas, or feedback regarding the Platform, you grant JollyWitMe the right to use such feedback without restriction or compensation.",
    },
    {
        num: "11",
        title: "Third-Party Services",
        icon: Layers,
        body: `The Platform may integrate with third-party services, including payment processors (Stripe), mapping services, email providers, SMS/WhatsApp providers, and social media platforms.
We are not responsible for the content, policies, or practices of third-party services. Your use of such services is subject to their terms and policies.`,
    },
    {
        num: "12",
        title: "Privacy",
        icon: Lock,
        body: "Our collection and use of personal information are governed by our Privacy Policy. By using the Platform, you consent to such collection and use.",
    },
    {
        num: "13",
        title: "Service Availability",
        icon: Activity,
        body: `We strive to maintain reliable service but do not guarantee that the Platform will always be available, uninterrupted, secure, or error-free.
We may modify features, temporarily suspend services, perform maintenance, or discontinue portions of the Platform without prior notice.`,
    },
    {
        num: "14",
        title: "Disclaimer of Warranties",
        icon: AlertOctagon,
        body: "The Platform is provided on an \"as is\" and \"as available\" basis. To the maximum extent permitted by law, JollyWitMe disclaims all warranties, whether express or implied, including warranties of Merchantability, Fitness for a particular purpose, Non-infringement, Reliability, and Availability.",
    },
    {
        num: "15",
        title: "Limitation of Liability",
        icon: Scale,
        body: "To the fullest extent permitted by law, JollyWitMe, its directors, employees, affiliates, and partners shall not be liable for indirect, incidental, or consequential damages, loss of profits, loss of business opportunities, data loss, or reputational loss arising from your use of the Platform. Nothing in these Terms excludes liability that cannot be excluded by applicable law.",
    },
    {
        num: "16",
        title: "Indemnification",
        icon: Shield,
        body: "You agree to indemnify and hold harmless JollyWitMe from any claims, damages, liabilities, losses, and expenses arising from your use of the Platform, your content, your events, your violation of these Terms, or your infringement of another person's rights.",
    },
    {
        num: "17",
        title: "Account Termination",
        icon: UserX,
        body: "We may suspend or terminate your account if you violate these Terms, if required by law, or if your activities present risk to the Platform or its users. Upon termination, your right to use the Platform ends immediately.",
    },
    {
        num: "18",
        title: "Changes to These Terms",
        icon: RefreshCw,
        body: "We may update these Terms from time to time. When significant changes are made, we will provide notice through the Platform or by email where appropriate. Continued use of the Platform after changes become effective constitutes acceptance of the revised Terms.",
    },
    {
        num: "19",
        title: "Governing Law",
        icon: Gavel,
        body: "These Terms shall be governed by and construed in accordance with the laws of Nigeria. Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the courts of Nigeria.",
    },
    {
        num: "20",
        title: "Contact Information",
        icon: Mail,
        body: `For questions regarding these Terms, please contact:

JollyWitMe
Email: support@jollywitme.com
Website: https://www.jollywitme.com`,
    },
];

export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen bg-[#070709] text-white selection:bg-emerald-500/30 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[160px] rounded-full" />
                <div className="absolute top-[45%] right-[-10%] w-[45%] h-[45%] bg-teal-600/10 blur-[180px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-green-600/5 blur-[160px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 pt-28 pb-24 relative z-10 max-w-5xl">
                {/* Back Link */}
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
                        <FileCheck2 className="w-3.5 h-3.5" />
                        User Agreement
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                        Terms of{" "}
                        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
                            Service
                        </span>
                    </h1>
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                        <span>Last Updated: 28 Aug 2026</span>
                        <span>•</span>
                        <span className="text-emerald-400">Binding Agreement</span>
                    </div>
                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl pt-2">
                        Welcome to JollyWitMe (&quot;JollyWitMe,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to and use of the JollyWitMe website, applications, and services.
                    </p>
                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-gray-400 max-w-2xl">
                        By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
                    </div>
                </div>

                {/* Terms Sections */}
                <div className="space-y-8">
                    {TERMS_SECTIONS.map((section) => {
                        const Icon = section.icon;
                        return (
                            <section
                                key={section.num}
                                className="bg-[#111114]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-emerald-500/30 transition-all shadow-xl space-y-4"
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
                                        Clause {section.num}
                                    </span>
                                </div>

                                <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                                    {section.body}
                                </p>
                            </section>
                        );
                    })}
                </div>

                {/* Footer Help Card */}
                <div className="mt-16 p-8 bg-[#111114] border border-white/10 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center sm:text-left">
                        <h3 className="font-bold text-lg text-white">Have questions about our terms?</h3>
                        <p className="text-xs text-gray-400">
                            Reach out to our legal and support team at any time.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/contact"
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Contact Legal Support</span>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

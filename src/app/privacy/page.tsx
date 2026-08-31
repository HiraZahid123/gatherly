import Link from "next/link";
import {
    Shield,
    Lock,
    Eye,
    Database,
    Bell,
    Cookie,
    Share2,
    Clock,
    UserCheck,
    Globe,
    Baby,
    ArrowLeft,
    Mail,
    FileText,
} from "lucide-react";

export const metadata = {
    title: "Privacy Policy | JollyWitMe",
    description:
        "Learn how JollyWitMe collects, uses, discloses, and safeguards your personal data, guest lists, and event media.",
};

const PRIVACY_SECTIONS = [
    {
        num: "01",
        title: "Information We Collect",
        icon: Database,
        content: `We may collect the following categories of information:`,
        subsections: [
            {
                heading: "Personal Information",
                body: "Information you voluntarily provide, including full name, email address, phone number, profile photo, event host details, and billing information (where applicable).",
            },
            {
                heading: "Event Information",
                body: "Information relating to events created on the Platform, including event titles, descriptions, dates and times, venues and locations, guest lists, RSVP responses, announcements, and comments/messages.",
            },
            {
                heading: "Technical Information",
                body: "Automatically collected data such as IP address, browser type, device information, operating system, referral URLs, usage analytics, cookies, and related identifiers.",
            },
        ],
    },
    {
        num: "02",
        title: "How We Use Your Information",
        icon: Eye,
        content: `We may use your information to:`,
        bullets: [
            "Provide, operate, and maintain the Platform",
            "Create and manage event pages and customized atmosphere themes",
            "Process RSVPs, guest lists, and attendee interactions",
            "Send invitations, updates, WhatsApp confirmations, and schedule notifications",
            "Improve platform functionality, speed, and user experience",
            "Respond to customer service and support inquiries",
            "Detect, investigate, and prevent fraud, abuse, and security incidents",
            "Comply with applicable legal obligations and enforce our Terms",
        ],
    },
    {
        num: "03",
        title: "Guest Information, User Content and Event Media",
        icon: FileText,
        content: `When event hosts upload guest details, JollyWitMe processes that information solely to facilitate event-related communications and guest management.
Event hosts are responsible for ensuring they have the legal right to provide guest information and communicate with attendees through the Platform.
Users may upload photographs, videos, comments, and other content to event pages. By uploading such content, users confirm they have the necessary rights and permissions to do so. JollyWitMe is not responsible for user-generated content but reserves the right to remove content that violates applicable laws, infringes intellectual property rights, or breaches our Terms of Service.`,
    },
    {
        num: "04",
        title: "Communications",
        icon: Bell,
        content: `We may send:
• Account-related emails and security alerts
• Event notifications and WhatsApp RSVP updates
• Service announcements and operational notices
• Customer support communications

You may unsubscribe from marketing communications at any time, although essential transaction and security communications will still be delivered.`,
    },
    {
        num: "05",
        title: "Cookies and Analytics",
        icon: Cookie,
        content: `We use cookies and similar browser storage technologies to:
• Remember user preferences and theme drafts
• Maintain secure login sessions
• Measure website traffic and performance
• Understand user behaviour to optimize platform features

You can control or disable cookies through your browser settings. Note that disabling cookies may affect certain login and interactive platform functionality.`,
    },
    {
        num: "06",
        title: "Sharing of Information",
        icon: Share2,
        content: `We do NOT sell your personal information. We may share information strictly with:`,
        subsections: [
            {
                heading: "Service Providers",
                body: "Trusted third-party vendors that help operate the Platform, including cloud hosting (e.g. Vercel, Hostinger), email delivery (SMTP/Hostinger), WhatsApp/SMS dispatch, payment gateways (Stripe), and analytics providers.",
            },
            {
                heading: "Legal Requirements",
                body: "We may disclose information where required by law, subpoena, or where necessary to comply with legal obligations, protect our rights, prevent fraud, or safeguard user safety.",
            },
        ],
    },
    {
        num: "07",
        title: "Data Retention",
        icon: Clock,
        content: `We retain personal information only for as long as necessary to:
• Provide our event services and active features
• Comply with accounting and legal obligations
• Resolve disputes and enforce our agreements

We may delete inactive accounts and associated temporary event data after a reasonable period in accordance with our internal retention schedules.`,
    },
    {
        num: "08",
        title: "Data Security",
        icon: Lock,
        content: `We implement commercially reasonable technical and organisational security measures designed to protect personal information from unauthorised access, loss, misuse, alteration, or disclosure. However, no method of transmission over the internet or electronic storage can be guaranteed 100% secure.`,
    },
    {
        num: "09",
        title: "Your Rights",
        icon: UserCheck,
        content: `Depending on your location and applicable data privacy law, you may have the right to:
• Access the personal information we hold about you
• Correct or update inaccurate data
• Request deletion of your personal information
• Restrict or object to certain processing activities
• Request data portability in a machine-readable format
• Withdraw consent where consent is the basis for processing

To exercise any of these rights, please contact our privacy desk at support@jollywitme.com.`,
    },
    {
        num: "10",
        title: "UK GDPR and EEA Privacy Rights",
        icon: Globe,
        content: `For users in the United Kingdom, European Economic Area (EEA), and similar jurisdictions, JollyWitMe processes personal data in accordance with applicable data protection laws, including the UK GDPR and Data Protection Act 2018. Where required, we rely on lawful bases including Performance of a Contract, Legal Obligations, Legitimate Interests, and User Consent.`,
    },
    {
        num: "11",
        title: "Children's Privacy",
        icon: Baby,
        content: `JollyWitMe is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that such information has been collected, we will take immediate, reasonable steps to delete it.`,
    },
    {
        num: "12",
        title: "International Transfers",
        icon: Globe,
        content: `Your information may be processed and stored on servers located outside your country of residence. Where international transfers occur, we take appropriate security measures to safeguard your personal data in accordance with applicable international data privacy standards.`,
    },
    {
        num: "13",
        title: "Changes to This Policy",
        icon: Clock,
        content: `We may update this Privacy Policy periodically. Any updates will be posted on this page with a revised "Last Updated" date. Continued use of the Platform after changes become effective constitutes your acceptance of the updated policy.`,
    },
    {
        num: "14",
        title: "Contact Us",
        icon: Mail,
        content: `If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:

JollyWitMe
Email: support@jollywitme.com
Website: https://www.jollywitme.com`,
    },
];

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-[#070709] text-white selection:bg-emerald-500/30 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[160px] rounded-full" />
                <div className="absolute top-[45%] left-[-10%] w-[45%] h-[45%] bg-teal-600/10 blur-[180px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[20%] w-[40%] h-[40%] bg-green-600/5 blur-[160px] rounded-full" />
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
                        <Shield className="w-3.5 h-3.5" />
                        Legal & Compliance
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                        Privacy{" "}
                        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
                            Policy
                        </span>
                    </h1>
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                        <span>Last Updated: 28 Aug 2026</span>
                        <span>•</span>
                        <span className="text-emerald-400">Official Document</span>
                    </div>
                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl pt-2">
                        At JollyWitMe (&quot;JollyWitMe&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our website, applications, and services.
                    </p>
                </div>

                {/* Privacy Sections */}
                <div className="space-y-8">
                    {PRIVACY_SECTIONS.map((section) => {
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

                                <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                                    {section.content}
                                </p>

                                {section.subsections && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        {section.subsections.map((sub, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-2 hover:border-white/10 transition-colors"
                                            >
                                                <h3 className="text-sm font-bold text-emerald-400">
                                                    {sub.heading}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                                                    {sub.body}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {section.bullets && (
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                        {section.bullets.map((b, idx) => (
                                            <li
                                                key={idx}
                                                className="text-xs sm:text-sm text-gray-300 flex items-start gap-2 bg-white/[0.02] p-3 rounded-xl border border-white/5"
                                            >
                                                <span className="text-emerald-400 font-bold">•</span>
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        );
                    })}
                </div>

                {/* Footer Help Card */}
                <div className="mt-16 p-8 bg-[#111114] border border-white/10 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center sm:text-left">
                        <h3 className="font-bold text-lg text-white">Questions regarding your privacy?</h3>
                        <p className="text-xs text-gray-400">
                            Our compliance team is ready to assist with data requests or inquiries.
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

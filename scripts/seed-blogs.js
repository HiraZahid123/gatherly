const { PrismaClient } = require("../src/generated/client");

const prisma = new PrismaClient();

const posts = [
    {
        slug: "how-to-create-unforgettable-events-2026",
        title: "How to Create Unforgettable Events in 2026",
        excerpt: "Great events don't happen by accident. Here's the complete playbook — from crafting the perfect invitation to building pre-event buzz that fills your RSVP list.",
        category: "Event Planning",
        authorName: "Alex Rivera",
        authorRole: "Head of Product",
        authorAvatar: "AR",
        publishedAt: new Date("2026-03-18T09:00:00.000Z"),
        readingTime: 6,
        coverGradient: "from-green-600 via-teal-700 to-emerald-800",
        coverEmoji: "✨",
        published: true,
        content: `<p>Planning an event used to mean spreadsheets, scattered email threads, and hoping your guests actually showed up. In 2026, the bar is higher — and so are the tools available to you.</p>

<p>Whether you're hosting an intimate dinner for twelve or a rooftop celebration for two hundred, the fundamentals haven't changed. What has changed is how little effort it takes to execute them well.</p>

<h2>Start with the invitation, not the venue</h2>

<p>Most hosts make the same mistake: they book the venue, plan the food, curate the playlist — and then, almost as an afterthought, send a plain-text email blast to their guest list.</p>

<p>The invitation <em>is</em> the first impression of your event. It sets the tone before a single candle is lit. A beautifully designed event page with a cover image, your personality in the description, and a clear RSVP prompt signals to guests that this event is worth their time.</p>

<blockquote>
  <p>"The quality of your invitation is the preview of the quality of your event."</p>
</blockquote>

<p>Spend twenty minutes on it. Choose a theme that matches the vibe. Write a description that makes people feel something. Include a cover image that makes them picture themselves there.</p>

<h2>The 72-hour rule for RSVPs</h2>

<p>Send your invitations exactly <strong>72 hours before your RSVP deadline</strong> — not weeks in advance. Here's why: the longer the window, the more people procrastinate. A shorter window creates urgency without pressure.</p>

<p>Follow up once, 24 hours before the deadline, with a personal nudge. Not a mass blast — a targeted message to people who haven't responded yet.</p>

<h2>Build social proof early</h2>

<p>People are more likely to RSVP when they can see others have already committed. Enable the guest list on your event page early — even if it's just three or four confirmed attendees — and make sure those early yeses are people your other guests know and respect.</p>

<h2>The day-of experience starts the night before</h2>

<p>Send a reminder with the practical details 18 hours before your event — parking, what to wear, what to bring. Not just the logistics, but the vibe.</p>

<h2>Capture it while it happens</h2>

<p>Enable the photo album on your event page and brief a few guests before the event to upload their shots throughout the night. The best events don't just happen. They ripple outward.</p>`,
    },
    {
        slug: "psychology-of-rsvps-why-guests-say-yes",
        title: "The Psychology of RSVPs: Why Guests Say Yes (and How to Nudge Them)",
        excerpt: "Understanding why people commit — or don't — is the single biggest lever for filling your guest list. We break down the cognitive science and what it means for your next event.",
        category: "Psychology",
        authorName: "Priya Kapoor",
        authorRole: "Growth Lead",
        authorAvatar: "PK",
        publishedAt: new Date("2026-03-05T10:00:00.000Z"),
        readingTime: 5,
        coverGradient: "from-yellow-600 via-rose-600 to-orange-600",
        coverEmoji: "🧠",
        published: true,
        content: `<p>You've sent the invitation. The event looks great. The date works. And yet — silence. Or worse, a string of "maybe"s that never convert.</p>

<p>This isn't a problem with your event. It's a problem with <em>friction</em>. And once you understand what creates it, you can systematically remove it.</p>

<h2>FOMO is real, but it needs a trigger</h2>

<p>Fear of missing out is the most powerful motivator for event attendance — but it doesn't activate on its own. It needs social evidence. When a guest opens your invitation and sees that people they admire are already going, a cascade starts.</p>

<h2>The "commitment and consistency" bias</h2>

<p>Once someone says yes to a small commitment, they're far more likely to follow through on a larger one. This is why multi-step RSVP flows work so well.</p>

<blockquote>
  <p>A "yes" you had to earn sticks better than a "yes" that required no effort.</p>
</blockquote>

<h2>Reduce decision fatigue</h2>

<p>One of the most common reasons for "maybe" responses isn't ambivalence about your event — it's ambivalence about the decision itself. A single, specific nudge removes the open-ended nature of the choice.</p>

<h2>Timing is everything</h2>

<ul>
  <li><strong>Day 1–2:</strong> Enthusiastic early adopters commit immediately</li>
  <li><strong>Day 3–7:</strong> Responses taper off sharply</li>
  <li><strong>48 hours before deadline:</strong> A second wave responds to urgency</li>
  <li><strong>Day of event:</strong> A small final wave from spontaneous types</li>
</ul>

<h2>The power of being asked personally</h2>

<p>The single highest-converting RSVP trigger is a personal, direct message from the host — even just one sentence: "I specifically want you there."</p>`,
    },
    {
        slug: "digital-invitations-complete-guide-2026",
        title: "Digital Invitations in 2026: The Complete Guide",
        excerpt: "Paper is beautiful but digital is powerful. Here's everything you need to know about creating, sending, and tracking digital invitations that actually get opened.",
        category: "Guides",
        authorName: "Marcus Thompson",
        authorRole: "Design Lead",
        authorAvatar: "MT",
        publishedAt: new Date("2026-02-20T08:00:00.000Z"),
        readingTime: 7,
        coverGradient: "from-cyan-600 via-teal-600 to-emerald-700",
        coverEmoji: "📬",
        published: true,
        content: `<p>The paperless invitation has been "the future" for about fifteen years now. In 2026, it finally, unambiguously, is.</p>

<h2>What a great digital invitation actually is</h2>

<p>A great digital invitation is a living event page — something that updates in real time, responds to your guests' actions, and continues to be useful from the moment it's sent until long after the event ends.</p>

<h2>Anatomy of a high-converting invitation</h2>

<p><strong>The cover image</strong> carries more weight than anything else. It should communicate the vibe of the event in under two seconds.</p>

<p><strong>The headline</strong> is your event title. Keep it short, specific, and evocative. "Summer Party" is forgettable. "Rooftop Sundowner — June Edition" is an event you can picture.</p>

<p><strong>The description</strong> is where you build anticipation. Describe what the experience will feel like, not just the logistics.</p>

<p><strong>The RSVP section</strong> should be simple, personal, and low-friction.</p>

<h2>Sharing: the medium matters</h2>

<ul>
  <li><strong>WhatsApp / iMessage:</strong> Highest open rates. Best for close friends and family.</li>
  <li><strong>Email:</strong> Better for professional or formal events.</li>
  <li><strong>Instagram Stories / DMs:</strong> Great for younger audiences and public-facing events.</li>
  <li><strong>Link in bio / QR code:</strong> Useful for broader audiences.</li>
</ul>

<blockquote>
  <p>The channel you choose tells guests as much about the event as the invitation itself.</p>
</blockquote>

<h2>After the event: the invitation keeps working</h2>

<p>Guests keep returning to it for photos, to relive the night, to share their favorite shots. That ongoing engagement is the best advertisement for your next one.</p>

<h2>One last thing: personalization beats scale</h2>

<p>The best digital invitations are the ones that don't feel digital at all.</p>`,
    },
];

async function seed() {
    console.log("🌱 Seeding static blog posts into the database...\n");

    for (const post of posts) {
        const existing = await prisma.blog.findUnique({ where: { slug: post.slug } });
        if (existing) {
            console.log(`⏭  Skipped (already exists): "${post.title}"`);
            continue;
        }
        await prisma.blog.create({ data: post });
        console.log(`✅ Created: "${post.title}"`);
    }

    console.log("\n✨ Seeding complete!");
    await prisma.$disconnect();
}

seed().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});

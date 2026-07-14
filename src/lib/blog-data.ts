export interface BlogPost {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    author: {
        name: string;
        role: string;
        avatar: string; // initials fallback
    };
    publishedAt: string; // ISO date string
    readingTime: number; // minutes
    coverGradient: string; // tailwind gradient classes
    coverEmoji: string;
    content: string; // HTML
}

export const BLOG_POSTS: BlogPost[] = [
    {
        slug: "how-to-create-unforgettable-events-2026",
        title: "How to Create Unforgettable Events in 2026",
        excerpt:
            "Great events don't happen by accident. Here's the complete playbook — from crafting the perfect invitation to building pre-event buzz that fills your RSVP list.",
        category: "Event Planning",
        author: { name: "Alex Rivera", role: "Head of Product", avatar: "AR" },
        publishedAt: "2026-03-18T09:00:00.000Z",
        readingTime: 6,
        coverGradient: "from-green-600 via-teal-700 to-emerald-800",
        coverEmoji: "✨",
        content: `
<p>Planning an event used to mean spreadsheets, scattered email threads, and hoping your guests actually showed up. In 2026, the bar is higher — and so are the tools available to you.</p>

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

<p>Follow up once, 24 hours before the deadline, with a personal nudge. Not a mass blast — a targeted message to people who haven't responded yet. Gatherly's broadcast feature lets you message pending guests specifically, so you're not annoying the people who already said yes.</p>

<h2>Build social proof early</h2>

<p>People are more likely to RSVP when they can see others have already committed. Enable the guest list on your event page early — even if it's just three or four confirmed attendees — and make sure those early yeses are people your other guests know and respect.</p>

<p>This is the offline version of "sold out" energy. When a guest opens your event page and sees familiar faces already going, the decision gets much easier.</p>

<h2>The day-of experience starts the night before</h2>

<p>Send a reminder with the practical details 18 hours before your event — parking, what to wear, what to bring. Not just the logistics, but the vibe. "It's going to be warm, the terrace will be open, wear something you can dance in."</p>

<p>These small touches make guests feel cared for before they've walked through the door. And cared-for guests arrive on time, stay longer, and tell their friends about it afterward.</p>

<h2>Capture it while it happens</h2>

<p>Enable the photo album on your event page and brief a few guests before the event to upload their shots throughout the night. By the time the party winds down, you'll have a living gallery that your guests can browse and share — and a reason to keep engaging with your event page long after the night ends.</p>

<p>The best events don't just happen. They ripple outward — into conversations, into social feeds, into the next invite that people can't wait to open.</p>
        `.trim(),
    },
    {
        slug: "psychology-of-rsvps-why-guests-say-yes",
        title: "The Psychology of RSVPs: Why Guests Say Yes (and How to Nudge Them)",
        excerpt:
            "Understanding why people commit — or don't — is the single biggest lever for filling your guest list. We break down the cognitive science and what it means for your next event.",
        category: "Psychology",
        author: { name: "Priya Kapoor", role: "Growth Lead", avatar: "PK" },
        publishedAt: "2026-03-05T10:00:00.000Z",
        readingTime: 5,
        coverGradient: "from-yellow-600 via-rose-600 to-orange-600",
        coverEmoji: "🧠",
        content: `
<p>You've sent the invitation. The event looks great. The date works. And yet — silence. Or worse, a string of "maybe"s that never convert.</p>

<p>This isn't a problem with your event. It's a problem with <em>friction</em>. And once you understand what creates it, you can systematically remove it.</p>

<h2>FOMO is real, but it needs a trigger</h2>

<p>Fear of missing out is the most powerful motivator for event attendance — but it doesn't activate on its own. It needs social evidence. When a guest opens your invitation and sees that people they admire are already going, a cascade starts: <em>What do they know that I don't? Will I regret not being there?</em></p>

<p>This is why enabling the guest list early — even with just a handful of confirmed attendees — matters disproportionately. The first five yeses do more work than the next fifty.</p>

<h2>The "commitment and consistency" bias</h2>

<p>Once someone says yes to a small commitment, they're far more likely to follow through on a larger one. This is why the multi-step RSVP flow works so well: when a guest selects "Going" first, then fills in their name, then verifies their email — each micro-commitment makes the next step easier and the final confirmation more durable.</p>

<blockquote>
  <p>A "yes" you had to earn sticks better than a "yes" that required no effort.</p>
</blockquote>

<p>Compare this to a simple "click here to confirm attendance" button. Low friction to say yes — but equally low friction to bail. Make them invest a little, and they'll protect that investment.</p>

<h2>Reduce decision fatigue</h2>

<p>One of the most common reasons for "maybe" responses isn't ambivalence about your event — it's ambivalence about the decision itself. Guests who haven't committed either way are in an uncomfortable cognitive state. They want to resolve it, but haven't found a reason to.</p>

<p>You can resolve it for them. A single, specific nudge — "We saved you a spot. Just tap Yes to confirm" — removes the open-ended nature of the choice. You're not asking them to weigh options; you're asking them to confirm something that already feels half-decided.</p>

<h2>Timing is everything</h2>

<p>There's a predictable response curve for any event invitation:</p>

<ul>
  <li><strong>Day 1–2:</strong> Enthusiastic early adopters commit immediately</li>
  <li><strong>Day 3–7:</strong> Responses taper off sharply</li>
  <li><strong>48 hours before deadline:</strong> A second wave responds to urgency</li>
  <li><strong>Day of event:</strong> A small final wave from spontaneous types</li>
</ul>

<p>Most hosts send one reminder, too early, to everyone. A better approach: send targeted reminders to non-responders only, timed to hit the 48-hour urgency window. "The deadline to RSVP is tomorrow — we'd love to have you there" lands differently than a generic reminder blast.</p>

<h2>The power of being asked personally</h2>

<p>Mass invitations feel like mass invitations. Even beautifully designed ones. The single highest-converting RSVP trigger is a personal, direct message from the host — even just one sentence: "I specifically want you there." It bypasses every psychological barrier listed above because it isn't about the event; it's about the relationship.</p>

<p>You can't send that to everyone. But you can identify the five or ten people whose presence would most shape the room, and send it to them. Their yes sets the tone for everyone else.</p>
        `.trim(),
    },
    {
        slug: "digital-invitations-complete-guide-2026",
        title: "Digital Invitations in 2026: The Complete Guide",
        excerpt:
            "Paper is beautiful but digital is powerful. Here's everything you need to know about creating, sending, and tracking digital invitations that actually get opened.",
        category: "Guides",
        author: { name: "Marcus Thompson", role: "Design Lead", avatar: "MT" },
        publishedAt: "2026-02-20T08:00:00.000Z",
        readingTime: 7,
        coverGradient: "from-cyan-600 via-teal-600 to-emerald-700",
        coverEmoji: "📬",
        content: `
<p>The paperless invitation has been "the future" for about fifteen years now. In 2026, it finally, unambiguously, is. Here's what that looks like in practice — and how to do it well.</p>

<h2>What a great digital invitation actually is</h2>

<p>Most people think of digital invitations as "email invites" or "e-vites." That's a bit like describing a sports car as "a thing with wheels." Technically true, missing the point.</p>

<p>A great digital invitation is a living event page — something that updates in real time, responds to your guests' actions, and continues to be useful from the moment it's sent until long after the event ends. It's a cover image that sets the mood, a description that builds anticipation, and a seamless RSVP flow that makes saying yes feel effortless.</p>

<h2>Anatomy of a high-converting invitation</h2>

<p><strong>The cover image</strong> carries more weight than anything else. It's the first thing a guest sees when they open your link. It should communicate the vibe of the event in under two seconds — which is roughly how long a guest gives it before deciding whether to read further. Abstract gradients work for casual parties. Real photography works for professional or milestone events. Match the energy.</p>

<p><strong>The headline</strong> is your event title. Keep it short, specific, and evocative. "Summer Party" is forgettable. "Rooftop Sundowner — June Edition" is an event you can picture.</p>

<p><strong>The description</strong> is where you build anticipation. Describe what the experience will feel like, not just the logistics. "There will be cocktails and a DJ" tells guests what. "We're taking over the rooftop from 7pm, DJ sets till midnight, open bar while supplies last" tells them what to look forward to.</p>

<p><strong>The RSVP section</strong> should be simple, personal, and low-friction. Three options — Going, Maybe, Can't Make It — covers the full range without overcomplicating the decision.</p>

<h2>Sharing: the medium matters</h2>

<p>Different sharing channels reach different guests differently:</p>

<ul>
  <li><strong>WhatsApp / iMessage:</strong> Highest open rates. Best for close friends and family. The link preview (cover image + title) does the selling.</li>
  <li><strong>Email:</strong> Better for professional or formal events. Still effective for older demographics.</li>
  <li><strong>Instagram Stories / DMs:</strong> Great for younger audiences and public-facing events. The visual preview is the hook.</li>
  <li><strong>Link in bio / QR code:</strong> Useful for events with a broader, less targeted audience.</li>
</ul>

<blockquote>
  <p>The channel you choose tells guests as much about the event as the invitation itself.</p>
</blockquote>

<h2>What to track and why</h2>

<p>The real advantage of digital invitations isn't the cost saving — it's the data. You know who's viewed your event, who's responded, who's pending, and who's on the waitlist. You can act on all of it.</p>

<p>Pending guests are your highest-value follow-up target. They've seen the invitation — they just haven't committed. A well-timed personal nudge to this specific group converts at a much higher rate than any mass reminder.</p>

<p>RSVPs themselves are useful signal: a sudden spike in "maybe" responses might indicate a scheduling conflict you should address. A surge in views without conversions might mean your description needs work.</p>

<h2>After the event: the invitation keeps working</h2>

<p>Here's something most hosts don't use: the post-event life of their invitation page. Guests keep returning to it for photos, to relive the night, to share their favorite shots. If you've enabled the photo album and comments, you've created a space where the event continues to exist socially for days or weeks after it ended.</p>

<p>That ongoing engagement is the best advertisement for your next one.</p>

<h2>One last thing: personalization beats scale</h2>

<p>You can blast a beautifully designed invitation to five hundred people and get mediocre results. Or you can send a personal message with the same link to the fifty people you most want there, and get a room full of people who feel genuinely invited — not mass-marketed to.</p>

<p>The best digital invitations are the ones that don't feel digital at all.</p>
        `.trim(),
    },
];

export function getBlogPost(slug: string): BlogPost | undefined {
    return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
    return [...BLOG_POSTS].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

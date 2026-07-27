export interface ArticleSection {
  id: string;
  heading: string;
  body: string; // markdown-lite: supports **bold**, `code`, [text](url), and \n for new paragraphs
  image?: string; // optional path to a screenshot image in /public/help/
  imageAlt?: string;
  callout?: {
    type: "tip" | "note" | "warning";
    text: string;
  };
  steps?: string[]; // numbered steps list
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  sections: ArticleSection[];
}

export interface CategorySection {
  title: string;
  articles: Article[];
}

export interface HelpCategory {
  slug: string;
  emoji: string;
  title: string;
  description: string;
  sections: CategorySection[];
}

// ─────────────────────────────────────────────
// HELP CENTER CONTENT
// ─────────────────────────────────────────────

export const helpCategories: HelpCategory[] = [
  // ───────────────────────────────────────────
  // 1. GETTING STARTED
  // ───────────────────────────────────────────
  {
    slug: "getting-started",
    emoji: "🎉",
    title: "Getting Started",
    description: "New to JollyWitMe? Start here.",
    sections: [
      {
        title: "The Basics",
        articles: [
          {
            slug: "signing-up",
            title: "Signing up & logging in",
            description: "How to create your JollyWitMe account and log in.",
            sections: [
              {
                id: "create-account",
                heading: "Creating your account",
                body: "You can sign up for JollyWitMe using your **email address** or by continuing with **Google**. The registration process is designed to be quick and straightforward.",
                steps: [
                  "Visit the JollyWitMe homepage at `localhost:3000`.",
                  "Look for the bright **Sign Up** button located in the top-right corner of the main navigation bar.",
                  "On the registration page, you'll see a central card. You can choose to enter your name, email, and a secure password manually.",
                  "Alternatively, click the large **Continue with Google** button for a one-click signup experience.",
                  "If you signed up via email, check your inbox for a verification message and click the confirmation link inside.",
                  "Once verified, you'll be automatically redirected to your new personalized dashboard.",
                ],
              },
              {
                id: "logging-in",
                heading: "Logging back in",
                body: "To return to your events, simply use the **Log In** link found next to the sign-up button on the homepage.",
                callout: {
                  type: "tip",
                  text: "If you ever lose your password, look for the 'Forgot password?' link just below the login fields. We'll send a reset link to your registered email immediately.",
                },
              },
            ],
          },
          {
            slug: "your-dashboard",
            title: "Navigating your dashboard",
            description: "A quick tour of the JollyWitMe dashboard layout.",
            sections: [
              {
                id: "dashboard-overview",
                heading: "Your home base",
                body: "The **Dashboard** is your central hub for all activity on JollyWitMe. It is organized into two main areas:\n\n1. **The Sidebar (Left)**: Contains navigation links for your events, your calendar, and your profile settings. This sidebar is always visible on large screens for easy access.\n\n2. **The Main View (Center)**: This area displays a list of your **Upcoming Events**. Each event is shown as a neat card with the date, time, and event name prominently displayed.",
              },
              {
                id: "create-from-dashboard",
                heading: "Quick-start shortcuts",
                body: "At the very top of your dashboard, you will find a prominent purple button labeled **+ Create Event**. Clicking this is the fastest way to start planning a new gathering.",
              },
            ],
          },
          {
            slug: "creating-your-first-event",
            title: "Creating your first event",
            description: "A detailed guide to the event creation workflow.",
            sections: [
              {
                id: "create-event",
                heading: "Using the Event Editor",
                body: "The event editor is a clean, multi-step form that guides you through the details of your party. Here is how to navigate it:",
                steps: [
                  "Click the **+ Create Event** button from your dashboard.",
                  "**Choose a Theme**: At the top of the editor, browse the row of theme presets (like Classic, Eclectic, or Fancy). Clicking a theme instantly updates the preview style on the right side of the screen.",
                  "**Add Details**: In the 'Event Name' field, give your party a title. Moving down the form, you'll find dedicated sections for the **Date**, **Time**, and **Location**.",
                  "**Add a Description**: Use the large text area to let your guests know what to expect (dress code, what to bring, etc.).",
                  "**Upload Art**: Use the 'Cover Photo' section to upload your own image or pick a vibrant design from our built-in gallery.",
                  "**Check Settings**: On the right-hand sidebar of the editor, toggle options like 'RSVP Enabled' or set a 'Maximum Capacity' if needed.",
                  "**Publish**: When everything looks perfect, click the **Publish** button in the top-right corner. Your event link is now active!",
                ],
              },
              {
                id: "event-visibility",
                heading: "Public vs. Private events",
                body: "Visibility settings are found in the 'Settings' section of the editor:\n\n- **Public**: Anyone with the secret link can view and RSVP to your event.\n- **Private**: The event is invisible to the public; only guests who are explicitly added by you can access the page.",
                callout: {
                  type: "note",
                  text: "You can change visibility settings at any time, even after the event has been published.",
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────
  // 2. MANAGING EVENTS
  // ───────────────────────────────────────────
  {
    slug: "managing-events",
    emoji: "📋",
    title: "Managing Events",
    description: "Edit details, manage settings, and stay in control of your event.",
    sections: [
      {
        title: "Event Settings",
        articles: [
          {
            slug: "editing-event-details",
            title: "Editing your event details",
            description: "How to update your event name, date, time, location, and description.",
            sections: [
              {
                id: "edit-details",
                heading: "Making changes to your event",
                body: "You can edit your event info at any time. When you are on your specific event's page, look for the **Edit** button (represented by a pencil icon) located near the top header, usually next to the event title.\n\nClicking this opens the full Event Editor where you can modify any field. Once you save your changes, the event page will update instantly for all guests.",
                callout: {
                  type: "note",
                  text: "Significant updates like changing the date or time will trigger an automatic notification to all guests who have already RSVP'd.",
                },
              },
            ],
          },
          {
            slug: "cancelling-event",
            title: "Cancelling or deleting an event",
            description: "How to safely cancel or permanently delete an event.",
            sections: [
              {
                id: "cancel-vs-delete",
                heading: "Cancelling vs. deleting",
                body: "**Cancelling** an event keeps the page active but displays a clear 'Cancelled' banner. All guests are notified via email/text.\n\n**Deleting** an event removes it entirely from your dashboard and the web. This is permanent.",
                callout: {
                  type: "warning",
                  text: "Deleting is irreversible! All RSVP data and event history will be permanently erased.",
                },
              },
              {
                id: "how-to-cancel",
                heading: "Steps to cancel",
                body: "Open your event page, click the three-dot **(...) More Options** menu in the top header, and select **Cancel Event**. You will be asked for a final confirmation before the notification is sent.",
              },
            ],
          },
          {
            slug: "adding-staff",
            title: "Adding a check-in team",
            description: "How to add staff members to help you scan guests at the door.",
            sections: [
              {
                id: "add-staff-members",
                heading: "Managing your event team",
                body: "For large events, you can add team members to help with guest check-ins. These users are assigned the **Scanner** role, which allows them to use the Check-In Terminal but does not give them permission to edit your event details.",
                steps: [
                  "Open your event page on a desktop browser.",
                  "Locate the vertical **Host Sidebar** on the far right side of the screen.",
                  "Click the three-dot **(...) More** button at the bottom of the sidebar.",
                  "Select **Event Settings** (the gear icon) from the popup menu.",
                  "In the settings window, click the **Manage Staff** tab on the left.",
                  "Enter the **email address** of the person you want to add and click **Add Staff**.",
                ],
                callout: {
                  type: "note",
                  text: "Staff members must have a JollyWitMe account to access the Check-In Terminal.",
                },
              },
            ],
          },
          {
            slug: "host-tools",
            title: "Accessing host tools",
            description: "How to manage your event once it is live.",
            sections: [
              {
                id: "host-sidebar",
                heading: "The Host Sidebar",
                body: "If you are the creator (owner) of an event, you will see a unique **Host Sidebar** on the right side of the screen when viewing the event page. This sidebar is your control center.",
                steps: [
                  "Log in to your JollyWitMe account.",
                  "Navigate to your event page from the dashboard.",
                  "Look for the translucent bar on the far right edge of the screen.",
                  "Use the icons to **Edit**, **Broadcast** messages, **Invite** guests, or open **Advanced Settings**.",
                ],
                callout: {
                  type: "tip",
                  text: "If you don't see the sidebar, ensure you are logged in with the same email used to create the event.",
                },
              },
            ],
          },
          {
            slug: "scanning-guests",
            title: "Scanning guests at the door",
            description: "Using the Check-In Terminal to verify attendee tickets.",
            sections: [
              {
                id: "qr-terminal",
                heading: "The Check-In Terminal",
                body: "JollyWitMe provides a built-in terminal that uses your device's camera to verify guest tickets. Each guest receives a unique QR code in their ticket after they RSVP.",
                steps: [
                  "Open the **Event Settings** as described in the 'Adding a check-in team' guide.",
                  "Click the **Check-In Terminal** tab in the settings menu.",
                  "Click the **Launch Camera** button. If prompted by your browser, click **Allow** to grant camera access.",
                  "Point your camera at the guest's QR code. A green **Verified** screen will appear for valid tickets.",
                ],
              },
              {
                id: "offline-scanning",
                heading: "Scanning without Internet",
                body: "If your event venue has poor Wi-Fi, you can use **Offline Mode** to continue scanning guests.",
                callout: {
                  type: "tip",
                  text: "While you still have internet, click **Go Offline** in the terminal to download the guest list. Scans are saved locally and will automatically sync to the server once you click **Go Online** again.",
                },
              },
              {
                id: "manual-entry",
                heading: "Manual Ticket Verification",
                body: "If a guest's screen is too dim or cracked for the camera to read, you can use the **Manual Entry** field at the bottom of the terminal. Simply type or paste the guest's unique ticket token and click **Verify**.",
              },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────
  // 3. INVITING GUESTS
  // ───────────────────────────────────────────
  {
    slug: "inviting-guests",
    emoji: "📩",
    title: "Inviting Guests",
    description: "Share your event and manage your guest list.",
    sections: [
      {
        title: "Sharing & RSVPs",
        articles: [
          {
            slug: "sharing-your-event",
            title: "Sharing your event link",
            description: "How to distribute your event link to guests.",
            sections: [
              {
                id: "share-link",
                heading: "The Share Dialog",
                body: "Sharing is easy on JollyWitMe. On your event page, locate the **Share** button at the top. Clicking it opens a 'Share Your Event' popup that gives you several options:\n\n- **Copy Link**: A single click to copy your unique event URL to your clipboard.\n- **Direct Share**: Buttons for quick-sharing to WhatsApp, Instagram, or Facebook.\n- **Invite via Email**: A field to enter guest email addresses directly.",
              },
            ],
          },
          {
            slug: "managing-rsvps",
            title: "Managing RSVPs",
            description: "View and manage your guest responses.",
            sections: [
              {
                id: "view-rsvps",
                heading: "Accessing the Guest List",
                body: "You can see who's coming by clicking the **Guest List** link in the left-hand sidebar of your event page. The list is organized into columns or sections based on response status: **Going**, **Maybe**, and **Can't Go**. Each guest's name is displayed alongside their profile picture if they have one.",
              },
              {
                id: "change-rsvp",
                heading: "Updating guest responses",
                body: "As the host, you have full control. If a friend tells you they are coming but forgot to update the site, find their name in the Guest List, click the small arrow or menu icon next to their entry, and select their new status manually.",
              },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────
  // 4. MESSAGING
  // ───────────────────────────────────────────
  {
    slug: "messaging",
    emoji: "💬",
    title: "Messaging",
    description: "Sending announcements and direct messages.",
    sections: [
      {
        title: "Communicating with Guests",
        articles: [
          {
            slug: "text-blast",
            title: "Sending a text blast",
            description: "How to message everyone on your guest list at once.",
            sections: [
              {
                id: "what-is-text-blast",
                heading: "Using Text Blasts",
                body: "A **Text Blast** allows you to send a single announcement to all guests simultaneously. To send one:\n\n1. Go to your event page.\n2. Click the **Message** button in the header.\n3. Choose 'Text Blast' from the options.\n4. Type your message and select which RSVP groups should receive it (e.g., 'Only those Going').\n5. Hit **Send Message**.",
                callout: {
                  type: "note",
                  text: "Messages are delivered via WhatsApp and email.",
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────
  // 5. GUEST EXPERIENCE
  // ───────────────────────────────────────────
  {
    slug: "guest-experience",
    emoji: "🌟",
    title: "Guest Experience",
    description: "Guidance for your attendees.",
    sections: [
      {
        title: "For Attendees",
        articles: [
          {
            slug: "how-to-rsvp",
            title: "How to RSVP to an event",
            description: "Step-by-step for guests attending a JollyWitMe event.",
            sections: [
              {
                id: "rsvp-steps",
                heading: "The RSVP Process",
                body: "When you receive a JollyWitMe link, follow these steps to secure your spot:",
                steps: [
                  "Open the link in any modern web browser.",
                  "Review the event details (time, location, host) on the main landing page.",
                  "Look for the large **RSVP** button near the bottom of the screen or in the sticky footer bar.",
                  "Select your status: **Going**, **Maybe**, or **Can't Go**.",
                  "If you aren't logged in, you can quickly provide your name and email to finalize your response.",
                  "Optionally, you can leave a 'Comment' for the host to see.",
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────
  // 6. ACCOUNT & PROFILE
  // ───────────────────────────────────────────
  {
    slug: "account-profile",
    emoji: "👤",
    title: "Account & Profile",
    description: "Manage your profile and settings.",
    sections: [
      {
        title: "Your Account",
        articles: [
          {
            slug: "updating-profile",
            title: "Updating your profile",
            description: "How to change your name, photo, and bio.",
            sections: [
              {
                id: "edit-profile",
                heading: "The Profile Editor",
                body: "Access your profile settings by clicking your **Avatar** (or your initials in a circle) in the top-right corner of any page. Select **Settings** from the dropdown menu.\n\nYou can then update your display name, upload a new profile picture by clicking the placeholder image, and save changes to your bio.",
              },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────
  // 7. GREETING CARDS
  // ───────────────────────────────────────────
  {
    slug: "greeting-cards",
    emoji: "🎴",
    title: "Greeting Cards",
    description: "Send beautiful digital cards to celebrate any occasion.",
    sections: [
      {
        title: "Getting Started with Cards",
        articles: [
          {
            slug: "sending-a-card",
            title: "Sending a greeting card",
            description: "How to create and send a digital card to someone special.",
            sections: [
              {
                id: "what-is-a-card",
                heading: "What are Greeting Cards?",
                body: "JollyWitMe Greeting Cards are beautiful, animated digital cards that you can send to anyone for any occasion — birthdays, weddings, or just to say 'Thank you'. Unlike typical emails, these cards feature full-screen animations and premium typography designed to WOW the recipient.",
              },
              {
                id: "open-card-creator",
                heading: "Opening the Card Creator",
                body: "You can send a greeting card at any time — no event required. To get started, click the **+ Create** button in the top navigation bar, then select **Send a card** from the dropdown menu. This will take you to the Card Creator at `/cards/create`.",
                steps: [
                  "Click the purple **+ Create** button in the top navbar.",
                  "In the dropdown that appears, click **Send a card**.",
                  "You will land on the Card Creator page.",
                ],
              },
              {
                id: "choose-template",
                heading: "Choosing a Template",
                body: "The Card Creator presents a gallery of ready-made templates for common occasions — birthdays, congratulations, thank-you notes, and more. Each template is displayed as a visual tile. Scroll through the gallery and **click** on any tile to select it as your starting point. A preview of the full card will appear on the right side of the screen.",
                callout: {
                  type: "tip",
                  text: "You can switch templates at any time without losing your written message — just click a different tile.",
                },
              },
              {
                id: "customise-card",
                heading: "Customising Your Card",
                body: "After selecting a template, the editor panel on the left lets you personalise the card. You can type a recipient name in the **To** field, write your personal message in the large **Message** text area, and optionally add your name in the **From** field.\n\nThe preview on the right updates as you type, so you can see exactly what the recipient will see.",
              },
              {
                id: "send-card",
                heading: "Sending Your Card",
                body: "Once you are happy with the card, click the **Send Card** button at the bottom of the editor panel. You will be prompted to enter the recipient's **email address**. Type their email and confirm. The card is delivered instantly to their inbox with a link to view it in full, with animations.",
                callout: {
                  type: "note",
                  text: "The recipient does not need a JollyWitMe account to open and read the card.",
                },
              },
            ],
          },
        ],
      },
    ],
  },
  // ───────────────────────────────────────────
  // 8. TICKETING & PAYOUTS (STRIPE CONNECT)
  // ───────────────────────────────────────────
  {
    slug: "ticketing-payouts",
    emoji: "🎟️",
    title: "Ticketing & Payouts",
    description: "Sell tickets for your events, manage pricing tiers, and connect Stripe Connect.",
    sections: [
      {
        title: "Payout Setup",
        articles: [
          {
            slug: "connecting-stripe",
            title: "Connecting your Stripe account",
            description: "How to set up Stripe Connect to collect payouts for your tickets.",
            sections: [
              {
                id: "stripe-onboarding",
                heading: "Setting up Stripe Connect",
                body: "To host paid events and charge attendees, you must link a **Stripe Connect** payout account. This links your banking information directly so you can accept guest ticket purchases and receive payouts.\n\nFor security, if you enable paid ticketing on an event, you will not be allowed to send invites or publish the event until Stripe has been successfully connected.",
                steps: [
                  "Log in and navigate to your **Dashboard**.",
                  "Open **Settings** (or click 'Connect Stripe' from the warning banner on your event edit page).",
                  "In the Stripe Settings panel, click **Connect Stripe Account**.",
                  "You will be securely redirected to Stripe onboarding. Follow the instructions to link your banking details.",
                  "Once completed, you will be redirected back to JollyWitMe with your payouts fully active and enabled!"
                ],
                callout: {
                  type: "tip",
                  text: "During development or test mode, you can click 'Skip this form' at the top of the Stripe onboarding page to instantly activate a mock connection without using real banking details."
                }
              }
            ]
          },
          {
            slug: "ticket-tiers",
            title: "Creating & managing ticket tiers",
            description: "How to configure General Admission, VIP, and custom ticket packages.",
            sections: [
              {
                id: "add-ticket-tiers",
                heading: "Configuring Pricing & Quantities",
                body: "Hosts can add multiple ticket options to cater to different guest types. Each ticket tier operates with its own price, total inventory capacity, and description.",
                steps: [
                  "Navigate to your event page and open **Event Settings** from the host menu.",
                  "Select the **Ticket Tiers** tab on the sidebar.",
                  "Click **+ Add Ticket Tier**.",
                  "Fill out the tier name (e.g. 'VIP Experience'), price in your local currency, and maximum quantity available.",
                  "Add an optional description (like 'Includes free welcome drinks') to clarify the package.",
                  "Click **Save Tier**. The ticket option is now live in the event checkout card!"
                ],
                callout: {
                  type: "note",
                  text: "Price changes only affect future ticket sales. Existing purchases will retain the price at which they were originally bought."
                }
              }
            ]
          }
        ]
      }
    ]
  },
  // ───────────────────────────────────────────
  // 9. LIMITS & WAITLISTS
  // ───────────────────────────────────────────
  {
    slug: "limits-waitlists",
    emoji: "⏳",
    title: "Limits & Waitlists",
    description: "Manage event capacities, deadlines, and waitlists automatically.",
    sections: [
      {
        title: "Capacity Control",
        articles: [
          {
            slug: "event-waitlists",
            title: "Event capacity & automatic waitlisting",
            description: "How the automatic waitlist triggers when capacity is reached.",
            sections: [
              {
                id: "how-waitlists-work",
                heading: "The Waitlist Queue",
                body: "If your event has limited space, you can set a **Maximum Capacity** limit in the event settings.\n\nOnce RSVPs reach this limit, any additional guest attempting to respond 'Going' is placed in an orderly, prioritized **Waitlist**. If a confirmed guest cancels their reservation, the first person on the waitlist is automatically promoted to 'Going' and notified via email/SMS.",
                callout: {
                  type: "tip",
                  text: "Hosts can manually promote waitlisted guests or override the capacity limit at any time from the Guest List manager."
                }
              }
            ]
          }
        ]
      }
    ]
  },
  // ───────────────────────────────────────────
  // 10. SOCIALS & COMMUNICATION
  // ───────────────────────────────────────────
  {
    slug: "socials-communication",
    emoji: "💬",
    title: "Socials & Communication",
    description: "Engage with guests using group chat, comment boards, and broadcasts.",
    sections: [
      {
        title: "Communication Tools",
        articles: [
          {
            slug: "event-chats",
            title: "Using group chat and DMs",
            description: "Chat with all event attendees or message guests individually.",
            sections: [
              {
                id: "group-chats",
                heading: "Interactive Event Chat",
                body: "Every event has a dedicated **Group Chat** where confirmed guests and staff can coordinate plans, ask questions, or share enthusiasm.\n\nTo access the chat, go to the event page and click the **Chat** icon in the sidebar. This opens a real-time sliding chat panel where you can message the room instantly.",
                callout: {
                  type: "note",
                  text: "Chat access is private and restricted strictly to accepted RSVPs and authorized hosts/staff."
                }
              }
            ]
          },
          {
            slug: "comments-board",
            title: "Social comments & announcements",
            description: "Post comments, GIFs, and reply to guest updates on the event board.",
            sections: [
              {
                id: "board-replies",
                heading: "The Social Wall",
                body: "Below the main details on your event landing page, you'll find the **Comment Board**. Guests can post comments, attach visual stickers/GIFs, and write replies to threads.\n\nHosts can pin crucial comments to the top of the comment board to make them serve as prominent announcements for all landing page visitors.",
                steps: [
                  "Scroll to the bottom of the event page.",
                  "Write your text in the input box, or click the **GIF** button to search and attach an animation.",
                  "Click **Post**.",
                  "To reply, click **Reply** below any guest comment to start a threaded conversation."
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

// ─────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────

export function getCategoryBySlug(slug: string): HelpCategory | undefined {
  return helpCategories.find((c) => c.slug === slug);
}

export function getArticleBySlug(
  categorySlug: string,
  articleSlug: string
): { category: HelpCategory; article: Article } | undefined {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return undefined;
  for (const section of category.sections) {
    const article = section.articles.find((a) => a.slug === articleSlug);
    if (article) return { category, article };
  }
  return undefined;
}

export function getAllArticles(): Array<{
  category: HelpCategory;
  article: Article;
}> {
  const result: Array<{ category: HelpCategory; article: Article }> = [];
  for (const category of helpCategories) {
    for (const section of category.sections) {
      for (const article of section.articles) {
        result.push({ category, article });
      }
    }
  }
  return result;
}

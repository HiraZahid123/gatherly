import { z } from "zod";

/**
 * Regex to check for HTML tags
 */
const noHtmlRegex = /<[^>]*>/;

/**
 * Helper to refine string for HTML tags
 */
const noHtml = (val: string | undefined | null) => {
    if (!val) return true;
    return !noHtmlRegex.test(val);
};

/**
 * Password validation schema
 * - Minimum 6 characters
 * - At least one letter and one number (optional for basic MVP)
 */
export const passwordSchema = z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z\d]/, "Password must contain at least one special character");

/**
 * Email validation schema
 */
export const emailSchema = z
    .string()
    .email("Invalid email address")
    .toLowerCase();

/**
 * Phone number validation schema
 * Accepts various formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
 */
export const phoneSchema = z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number is too long")
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format")
    .optional();

/**
 * Profile update validation schema
 */
export const profileUpdateSchema = z.object({
    name: z.string()
        .min(1, "Name is required")
        .max(100, "Name is too long")
        .refine(noHtml, { message: "HTML tags are not allowed" })
        .optional()
        .or(z.literal("")),
    phone: phoneSchema.or(z.literal("")),
    image: z.string().refine(
        (val) => !val || val === "" || val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"),
        { message: "Invalid image path or URL" }
    ).optional().or(z.literal("")),
});

/**
 * Password reset request schema
 * Supports either email or phone number
 */
export const forgotPasswordSchema = z.object({
    identifier: z.string().min(1, "Email or phone number is required"),
});

/**
 * Password reset schema
 */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

/**
 * User registration schema
 */
export const registerSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    email: emailSchema,
    password: passwordSchema,
});

/**
 * File upload validation
 */
export const imageFileSchema = z.object({
    size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB"),
    type: z.enum(["image/jpeg", "image/png", "image/webp", "image/jpg"]).refine(
        (val) => ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(val),
        { message: "Only JPEG, PNG, and WebP images are allowed" }
    ),
});

/**
 * Validate phone number format and clean it
 */
export function formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, "");
}

/**
 * Check password strength
 */
export function getPasswordStrength(password: string): {
    strength: "weak" | "medium" | "strong";
    score: number;
} {
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z\d]/.test(password)) score += 1;

    if (score <= 2) return { strength: "weak", score };
    if (score <= 4) return { strength: "medium", score };
    return { strength: "strong", score };
}

/**
 * Event creation validation schema
 */
export const eventCreateSchema = z.object({
    title: z.string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title is too long")
        .refine(noHtml, { message: "HTML tags are not allowed in title" }),
    type: z.enum(["EVENT", "CARD"]).default("EVENT"),
    description: z.string()
        .max(5000, "Description is too long")
        .refine(noHtml, { message: "HTML tags are not allowed in description" })
        .optional()
        .or(z.literal("")),
    location: z.string()
        .max(200, "Location is too long")
        .refine(noHtml, { message: "HTML tags are not allowed in location" })
        .optional()
        .or(z.literal("")),
    coverImage: z.string().optional().or(z.literal("")),
    startDate: z.string().datetime("Invalid start date format"),
    endDate: z.string().datetime("Invalid end date format").optional().or(z.literal("")),
    capacity: z.number().int().positive("Capacity must be a positive number").optional().nullable(),
    rsvpDeadline: z.string().datetime("Invalid RSVP deadline format").nullable().optional(),
    checkInWindowStart: z.number().min(0, "Check-in window cannot be negative").optional(),
    maxCheckIns: z.number().min(1, "Maximum check-ins per QR must be at least 1").optional(),
    cost: z.string().optional().nullable(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).default("PUBLIC"),
    isPrivate: z.boolean().optional(),
    isPaid: z.boolean().optional(),
    guestListHidden: z.boolean().optional(),
    status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
    theme: z.object({
        backgroundTheme: z.string().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
        bannerImage: z.string().optional().or(z.literal("")),
        vibeId: z.string().optional(),
        effect: z.string().optional(),
        rsvpStyle: z.string().optional(),
        showRSVP: z.boolean().optional(),
        rsvpLabels: z.object({
            going: z.string().optional(),
            maybe: z.string().optional(),
            notGoing: z.string().optional(),
        }).optional(),
        settings: z.object({
            hosts: z.object({
                cohosts: z.array(z.any()).optional(),
                linkSharing: z.boolean().optional(),
            }).optional(),
            rsvp: z.object({
                enabled: z.boolean().optional(),
                requireApproval: z.boolean().optional(),
                capacity: z.union([z.number().int().nonnegative("Capacity cannot be negative"), z.literal(null)]).optional(),
                waitlist: z.boolean().optional(),
                plusOnes: z.number().int().nonnegative("Number of plus-ones cannot be negative").optional(),
                requireNames: z.boolean().optional(),
                allowMutuals: z.boolean().optional(),
                buttonStyle: z.string().optional(),
                allowMaybe: z.boolean().optional(),
            }).optional(),
            privacy: z.object({
                showTimestamps: z.boolean().optional(),
                showNames: z.boolean().optional(),
                showCount: z.boolean().optional(),
                requirePassword: z.boolean().optional(),
                password: z.string().optional().or(z.literal("")),
            }).optional(),
            links: z.array(z.object({
                id: z.string(),
                text: z.string(),
                url: z.string(),
                icon: z.string(),
            })).optional(),
            sections: z.array(z.object({
                id: z.string(),
                title: z.string(),
                content: z.string(),
            })).optional(),
        }).optional(),
    }).optional(),
}).refine((data) => {
    if (data.endDate && data.endDate !== "") {
        return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
}, {
    message: "End date must be after start date",
    path: ["endDate"],
});

/**
 * Event update validation schema (all fields optional)
 */
export const eventUpdateSchema = z.object({
    title: z.string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title is too long")
        .refine(noHtml, { message: "HTML tags are not allowed in title" })
        .optional(),
    description: z.string()
        .max(5000, "Description is too long")
        .refine(noHtml, { message: "HTML tags are not allowed in description" })
        .optional()
        .or(z.literal("")),
    location: z.string()
        .max(200, "Location is too long")
        .refine(noHtml, { message: "HTML tags are not allowed in location" })
        .optional()
        .or(z.literal("")),
    coverImage: z.string().optional().or(z.literal("")),
    startDate: z.string().datetime("Invalid start date format").optional(),
    endDate: z.string().datetime("Invalid end date format").optional().or(z.literal("")),
    rsvpDeadline: z.string().datetime("Invalid RSVP deadline format").nullable().optional(),
    checkInWindowStart: z.number().min(0, "Check-in window cannot be negative").optional(),
    maxCheckIns: z.number().min(1, "Maximum check-ins per QR must be at least 1").optional(),
    cost: z.string().optional().nullable(),
    capacity: z.number().int().positive("Capacity must be a positive number").optional().nullable(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional(),
    isPrivate: z.boolean().optional(),
    isPaid: z.boolean().optional(),
    guestListHidden: z.boolean().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED", "ARCHIVED"]).optional(),
    theme: z.object({
        backgroundTheme: z.string().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
        bannerImage: z.string().optional().or(z.literal("")),
        vibeId: z.string().optional(),
        effect: z.string().optional(),
        rsvpStyle: z.string().optional(),
        showRSVP: z.boolean().optional(),
        rsvpLabels: z.object({
            going: z.string().optional(),
            maybe: z.string().optional(),
            notGoing: z.string().optional(),
        }).optional(),
        settings: z.object({
            hosts: z.object({
                cohosts: z.array(z.any()).optional(),
                linkSharing: z.boolean().optional(),
            }).optional(),
            rsvp: z.object({
                enabled: z.boolean().optional(),
                requireApproval: z.boolean().optional(),
                capacity: z.union([z.number().int().nonnegative("Capacity cannot be negative"), z.literal(null)]).optional(),
                waitlist: z.boolean().optional(),
                plusOnes: z.number().int().nonnegative("Number of plus-ones cannot be negative").optional(),
                requireNames: z.boolean().optional(),
                allowMutuals: z.boolean().optional(),
                buttonStyle: z.string().optional(),
                allowMaybe: z.boolean().optional(),
            }).optional(),
            privacy: z.object({
                showTimestamps: z.boolean().optional(),
                showNames: z.boolean().optional(),
                showCount: z.boolean().optional(),
                requirePassword: z.boolean().optional(),
                password: z.string().optional().or(z.literal("")),
            }).optional(),
            links: z.array(z.object({
                id: z.string(),
                text: z.string(),
                url: z.string(),
                icon: z.string(),
            })).optional(),
            sections: z.array(z.object({
                id: z.string(),
                title: z.string(),
                content: z.string(),
            })).optional(),
        }).optional(),
        links: z.array(z.object({
            id: z.string(),
            text: z.string(),
            url: z.string(),
            icon: z.string(),
        })).optional(),
        sections: z.array(z.object({
            id: z.string(),
            title: z.string(),
            content: z.string(),
        })).optional(),
    }).optional(),
}).refine((data) => {
    if (data.startDate && data.endDate && data.endDate !== "") {
        return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
}, {
    message: "End date must be after start date",
    path: ["endDate"],
});

export const invitationCreateSchema = z.object({
    emails: z.array(z.string().email("Invalid email address")).optional().default([]),
    phones: z.array(
        z.string()
            .min(7, "Phone number too short")
            .max(20, "Phone number too long")
            .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format")
    ).optional().default([]),
}).refine(
    (data) => (data.emails?.length ?? 0) + (data.phones?.length ?? 0) > 0,
    { message: "Provide at least one email or phone number" }
);


export const rsvpSubmitSchema = z.object({
    status: z.enum(["ACCEPTED", "DECLINED", "MAYBE", "WAITLISTED"]),
    guestName: z.string()
        .min(1, "Name is required")
        .max(100, "Name is too long")
        .refine(noHtml, { message: "HTML tags are not allowed" }),
    guestEmail: z.string().email("Invalid email address").toLowerCase(),
    inviteToken: z.string().optional(),
    captchaToken: z.string().optional(),
});

export const rsvpVerifySchema = z.object({
    guestEmail: z.string().email("Invalid email address").toLowerCase(),
    otp: z.string().length(6, "OTP must be 6 digits"),
    status: z.enum(["ACCEPTED", "DECLINED", "MAYBE", "WAITLISTED"]),
    guestName: z.string().min(1, "Name is required"),
    captchaToken: z.string().optional(),
});

export const rsvpResendSchema = z.object({
    guestEmail: z.string().email("Invalid email address").toLowerCase(),
});

export const checkInSchema = z.object({
    qrToken: z.string().min(1, "QR Token is required"),
});

export const staffAddSchema = z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
});

export const broadcastSchema = z.object({
    message: z.string().min(10, "Message must be at least 10 characters"),
    audience: z.enum(["ALL", "ACCEPTED", "WAITLISTED"])
});

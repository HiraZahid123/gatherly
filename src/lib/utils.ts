export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphens with single
        .trim()
        + '-' + Math.random().toString(36).substring(2, 8); // Add random suffix
}

export function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

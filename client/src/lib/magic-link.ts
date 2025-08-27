/**
 * Magic Link utilities for Muddiest Point
 * Provides functions for generating and validating magic links
 */

export interface MagicLinkData {
  id: string;
  token: string;
  email?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface MagicLinkSubmissionHistory {
  magicLink: MagicLinkData;
  submissions: Array<{
    id: string;
    courseId: string;
    topic: string;
    confusion: string;
    difficultyLevel: string;
    createdAt: string;
    course: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

/**
 * Generates a magic link URL for the given token
 */
export function generateMagicLinkUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/track/${token}`;
}

/**
 * Validates a magic link token format
 */
export function isValidMagicLinkToken(token: string): boolean {
  // Basic UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

/**
 * Fetches magic link data and submission history
 */
export async function fetchMagicLinkData(token: string): Promise<MagicLinkSubmissionHistory | null> {
  if (!isValidMagicLinkToken(token)) {
    throw new Error("Invalid magic link token format");
  }

  try {
    const response = await fetch(`/api/magic-links/${token}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Magic link not found
      }
      throw new Error(`Failed to fetch magic link data: ${response.statusText}`);
    }

    const data = await response.json();
    return data as MagicLinkSubmissionHistory;
  } catch (error) {
    console.error("Error fetching magic link data:", error);
    throw error;
  }
}

/**
 * Creates a new magic link
 */
export async function createMagicLink(email?: string): Promise<{ id: string; magicUrl: string }> {
  try {
    const response = await fetch("/api/magic-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create magic link: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating magic link:", error);
    throw error;
  }
}

/**
 * Gets a human-readable label for difficulty levels
 */
export function getDifficultyLabel(level: string): string {
  switch (level) {
    case "slightly": return "Slightly Confused";
    case "very": return "Very Confused";
    case "completely": return "Completely Lost";
    default: return level;
  }
}

/**
 * Gets appropriate styling class for difficulty levels
 */
export function getDifficultyClass(level: string): string {
  switch (level) {
    case "slightly": return "bg-primary/10 text-primary border-primary/20";
    case "very": return "bg-accent/10 text-accent border-accent/20";
    case "completely": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "bg-muted text-muted-foreground border-muted/20";
  }
}

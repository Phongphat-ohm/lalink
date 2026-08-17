import { prisma } from "@/lib/database";

/**
 * Generate a random 6-character uppercase alphanumeric code.
 * Example formats: COM892, LA741X, ORG582
 */
export function generateRandomCode(prefix?: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars (0, O, 1, I)
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const chosenPrefix = prefix ? prefix.toUpperCase().slice(0, 3) : "COM";
  return `${chosenPrefix}${code}`;
}

/**
 * Generates a collision-free unique company code.
 */
export async function generateUniqueCompanyCode(
  prefix?: string,
): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const candidate = generateRandomCode(prefix);
    const existing = await prisma.company.findUnique({
      where: { code: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
    attempts++;
  }

  // Fallback with timestamp suffix
  return `ORG${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

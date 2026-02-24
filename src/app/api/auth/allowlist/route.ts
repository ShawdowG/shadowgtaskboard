import { NextResponse } from "next/server";

type Payload = { email?: string };

const defaultAllowedEmails = ["kantasitms1@outlook.com"];

const emailSet = new Set(
  (process.env.ALLOWED_EMAILS ?? process.env.NEXT_PUBLIC_ALLOWED_EMAILS ?? defaultAllowedEmails.join(","))
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean),
);

const domainSet = new Set(
  (process.env.ALLOWED_DOMAINS ?? process.env.NEXT_PUBLIC_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean),
);

const isAllowed = (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return false;
  if (emailSet.has(normalized)) return true;
  const domain = normalized.split("@")[1];
  if (!domain) return false;
  return domainSet.has(domain);
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Payload;
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!email) {
    return NextResponse.json({ allowed: false, error: "Missing email" }, { status: 400 });
  }

  return NextResponse.json({ allowed: isAllowed(email) });
}

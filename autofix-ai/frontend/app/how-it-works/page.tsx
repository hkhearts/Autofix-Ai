import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ScanLine, Search, UserRoundCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "How Autofix-AI Works",
  description:
    "Learn how Autofix-AI turns support tickets into reusable resolutions with screenshot analysis, incident memory, and human review.",
};

const steps = [
  {
    number: "01",
    title: "Capture the incident",
    description:
      "A user submits a support ticket with a description and, when useful, a screenshot of the error. The ticket gives the support workflow its starting context.",
    icon: BookOpen,
  },
  {
    number: "02",
    title: "Understand the error",
    description:
      "When a screenshot is provided, vision-assisted analysis extracts relevant error details. The description and extracted details are combined into a normalized incident signature.",
    icon: ScanLine,
  },
  {
    number: "03",
    title: "Look for a proven resolution",
    description:
      "Autofix-AI searches its incident memory for similar cases and their recorded outcomes. A relevant past fix can inform the recommendation for the current ticket.",
    icon: Search,
  },
  {
    number: "04",
    title: "Resolve with the right level of review",
    description:
      "High-confidence matches can follow the configured automated path. If confidence is below the decision threshold, the ticket stays in the human review queue instead.",
    icon: UserRoundCheck,
  },
  {
    number: "05",
    title: "Learn from verified outcomes",
    description:
      "Once an engineer verifies a resolution, the outcome is recorded in persistent memory. That verified experience can help the team handle similar incidents in the future.",
    icon: CheckCircle2,
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-[#0d0d12] dark:text-white sm:px-10 sm:py-16">
      <article className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Autofix-AI
        </Link>

        <header className="mt-12 border-b border-slate-200 pb-10 dark:border-zinc-800 sm:mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-600 dark:text-yellow-400">
            The Autofix-AI workflow
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            From support ticket to shared knowledge
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-zinc-300">
            Autofix-AI helps support teams turn incident context and verified fixes into a
            repeatable learning loop. Here&apos;s how a ticket moves through that process.
          </p>
        </header>

        <div className="divide-y divide-slate-200 dark:divide-zinc-800">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <section key={number} className="grid gap-5 py-8 sm:grid-cols-[5rem_1fr] sm:gap-8 sm:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-yellow-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-yellow-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-xs font-bold tracking-widest text-slate-400 dark:text-zinc-500">
                  STEP {number}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold">{title}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-slate-600 dark:text-zinc-300">
                  {description}
                </p>
              </div>
            </section>
          ))}
        </div>

        <aside className="mt-10 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-7 sm:p-9">
          <h2 className="text-xl font-extrabold">People stay in the loop</h2>
          <p className="mt-3 leading-relaxed text-slate-700 dark:text-zinc-300">
            Persistent memory is only useful when it reflects trustworthy outcomes. Autofix-AI
            keeps lower-confidence cases available for engineer review, and verified resolutions
            strengthen future recommendations.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Explore the ticket console
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </article>
    </main>
  );
}

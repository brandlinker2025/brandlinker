import { buttonVariants } from "@/components/ui/button";
import {
  communityFacebookUrl,
  facebookUrl,
  fiverrUrl,
  linkedinUrl,
  tiktokUrl,
} from "@/lib/site";
import { cn } from "@/lib/utils";

export function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.16" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Georgia, serif"
        fontSize="11"
        fontWeight="700"
      >
        in
      </text>
    </svg>
  );
}

export function FacebookMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.16" />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Georgia, serif"
        fontSize="16"
        fontWeight="700"
      >
        f
      </text>
    </svg>
  );
}

export function FiverrMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.16" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Georgia, serif"
        fontSize="11"
        fontWeight="700"
      >
        fi
      </text>
    </svg>
  );
}

export function TikTokMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.16" />
      <path
        d="M14.2 6.2v7.4a2.5 2.5 0 1 1-1.6-2.3V9.1l4.6-1V6.2h-3z"
        fill="currentColor"
      />
    </svg>
  );
}

const iconLink =
  "inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-[#ffa45c] transition-colors hover:border-[#2f7bff] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7bff]";

export function HireFiverrButton({ className }: { className?: string }) {
  return (
    <a
      href={fiverrUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ size: "lg" }),
        "h-12 rounded-full px-6 text-base",
        className,
      )}
    >
      Hire me on Fiverr
    </a>
  );
}

export function SocialLinks({
  className,
  community = false,
}: {
  className?: string;
  community?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Razia Sultana Lina on LinkedIn"
        className={iconLink}
      >
        <LinkedInMark className="size-6" />
      </a>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="RSLina on Facebook"
        className={iconLink}
      >
        <FacebookMark className="size-6" />
      </a>
      <a
        href={tiktokUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="RSLina on TikTok, @raziasultanalina"
        className={iconLink}
      >
        <TikTokMark className="size-6" />
      </a>
      {community ? (
        <a
          href={communityFacebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center rounded-full border border-white/15 px-3 text-sm text-white/80 transition-colors hover:border-[#2f7bff] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7bff]"
        >
          Creative Minded BD
        </a>
      ) : null}
      <a
        href={fiverrUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center rounded-full border border-white/15 px-3 text-sm text-white/80 transition-colors hover:border-[#2f7bff] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7bff]"
      >
        Fiverr
      </a>
    </div>
  );
}

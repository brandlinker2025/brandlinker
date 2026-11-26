import { ContactSection } from "@/components/contact-section";
import { CorporateStrip } from "@/components/corporate-strip";
import { SkillsSection } from "@/components/skills-section";
import { PremiumAbout } from "@/components/premium/about";
import { CareerTimeline } from "@/components/premium/career-timeline";
import { Beyond } from "@/components/premium/beyond";
import { PremiumHero } from "@/components/premium/hero";
import { ImpactNumbers } from "@/components/premium/impact";
import { Recognition } from "@/components/premium/recognition";
import { RidersBento } from "@/components/premium/riders-bento";
import { StickyContact } from "@/components/premium/sticky-contact";
import {
  aboutAnswer,
  facebookUrl,
  instagramUrl,
  fiverrUrl,
  linkedinUrl,
  siteDescription,
  siteTitle,
  siteUrl,
  tiktokUrl,
} from "@/lib/site";

export default function HomePage() {
  const personId = `${siteUrl}/#person`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: "Razia Sultana Lina",
        alternateName: ["RS Lina", "RSLina"],
        url: siteUrl,
        image: `${siteUrl}/corporate/portrait-dark.jpg`,
        description: aboutAnswer,
        jobTitle: "Manager",
        worksFor: {
          "@type": "Organization",
          name: "ACI Motors Ltd.",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Dhaka",
          addressCountry: "BD",
        },
        sameAs: [linkedinUrl, fiverrUrl, instagramUrl, facebookUrl, tiktokUrl],
      },
      {
        "@type": "Organization",
        "@id": "https://www.brandlinkerbd.com/#organization",
        name: "BrandLinker",
        url: "https://www.brandlinkerbd.com/",
        founder: { "@id": personId },
        subOrganization: [
          { "@type": "Organization", name: "BrandLinker Dubai", url: "https://brandlinkerdubai.com/" },
          { "@type": "Organization", name: "BrandLinker Spark", url: "https://www.brandlinkerspark.com/" },
          { "@type": "Organization", name: "BrandLinker Studio", url: "https://brandlinkerstudio.com/" },
          { "@type": "Organization", name: "Cheap Ticket Finder", url: "https://cheapticketfinder.site/" },
          { "@type": "Organization", name: "SheRides", url: "https://sherides.online/" },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Razia Sultana Lina (RS Lina)",
        alternateName: ["RS Lina", "RSLina", "rslina"],
        inLanguage: "en",
        publisher: { "@id": personId },
      },
      {
        "@type": "ProfilePage",
        "@id": `${siteUrl}/#profilepage`,
        url: siteUrl,
        name: siteTitle,
        description: siteDescription,
        inLanguage: "en",
        dateModified: "2026-10-30",
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntity: { "@id": personId },
      },
    ],
  };

  return (
    <main>
      <PremiumHero />
      <PremiumAbout />
      <ImpactNumbers />
      <CareerTimeline />
      <Beyond />
      <CorporateStrip />
      <SkillsSection />
      <Recognition />
      <RidersBento />
      <ContactSection />
      <StickyContact />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </main>
  );
}

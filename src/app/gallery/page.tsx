import type { Metadata } from "next";
import { PhotoAlbum } from "@/components/photo-album";
import { RibbonGallery } from "@/components/ribbon-gallery";

const description =
  "Photo album of RS Lina: riding tours and rallies across Bangladesh, plus official moments from Yamaha and earlier roles.";

export const metadata: Metadata = {
  title: "Gallery",
  description,
  alternates: { canonical: "/gallery" },
  openGraph: { title: "Gallery · RSLina", description, url: "/gallery" },
  twitter: { title: "Gallery · RSLina", description },
};

export default function GalleryPage() {
  return (
    <main>
      <RibbonGallery />
      <PhotoAlbum />
    </main>
  );
}

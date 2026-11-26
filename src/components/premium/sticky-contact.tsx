import Link from "next/link";

export function StickyContact() {
  return (
    <div className="sticky-contact md:hidden">
      <Link href="/collaborate" className="liquid tap flex w-full items-center justify-center rounded-full text-base">
        Contact Lina
      </Link>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import type { ContentItem } from "../lib/types";

const routeByKind = {
  comic: "/comics",
  animation: "/animation",
  game: "/games",
};

export default function ContentCard({ item }: { item: ContentItem }) {
  return (
    <article className="content-card animate-rise">
      <div className="relative aspect-[4/5]">
        <Image
          src={item.thumbnail_url}
          alt={`${item.title} cover`}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="p-5">
        <p className="eyebrow">{item.kind}</p>
        <h3 className="mt-2 text-2xl font-black uppercase leading-tight text-white">
          {item.title}
        </h3>
        <p className="mt-3 min-h-20 text-sm leading-6 text-zinc-400">
          {item.description}
        </p>
        <Link
          href={`${routeByKind[item.kind]}/${item.slug}`}
          className="btn btn-secondary mt-5 w-full"
        >
          Open
        </Link>
      </div>
    </article>
  );
}

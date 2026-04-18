import Link from "next/link";
import Image from "next/image";
import { getContentBySlug } from "../../../lib/content";

export const dynamic = "force-dynamic";

type GameDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { slug } = await params;
  const game = await getContentBySlug("game", slug);

  if (!game) {
    return (
      <main className="section-shell">
        <h1 className="text-4xl font-black uppercase">Game not found</h1>
      </main>
    );
  }

  return (
    <main>
      <section className="relative isolate min-h-[78vh] overflow-hidden">
        <Image
          src={game.thumbnail_url}
          alt={`${game.title} artwork`}
          fill
          priority
          className="absolute inset-0 -z-10 object-cover opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#030303_0%,rgba(3,3,3,.86)_50%,rgba(3,3,3,.38)_100%)]" />
        <div className="mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-6 py-24">
          <p className="eyebrow">Game detail</p>
          <h1 className="mt-3 max-w-4xl text-6xl font-black uppercase leading-none">
            {game.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            {game.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="btn btn-primary">Prototype coming soon</button>
            <Link href="/games" className="btn btn-secondary">
              Back to games
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

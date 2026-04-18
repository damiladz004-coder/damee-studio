import Link from "next/link";
import Image from "next/image";
import { featuredContent } from "../lib/demo-data";
import ContentCard from "../components/ContentCard";

export default function Home() {
  return (
    <main>
      <section className="relative isolate min-h-[88vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1800&q=80"
          alt="A cinematic comic hero scene"
          fill
          priority
          className="absolute inset-0 -z-10 object-cover opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#030303_0%,rgba(3,3,3,.86)_34%,rgba(3,3,3,.46)_100%)]" />
        <div className="mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 py-24">
          <p className="eyebrow">Comics. Animation. Games.</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-none text-white sm:text-7xl lg:text-8xl">
            Damee Studio
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Original worlds built for bold characters, cinematic stories, and
            interactive adventures.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/comics" className="btn btn-primary">
              Start reading
            </Link>
            <Link href="/auth/signup" className="btn btn-secondary">
              Join the studio
            </Link>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <p className="eyebrow">Featured drops</p>
          <h2>Enter the Damee universe</h2>
          <p>
            Browse launch titles across comics, animation, and playable story
            worlds.
          </p>
        </div>
        <div className="content-grid">
          {featuredContent.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-3">
          {[
            ["Read", "Scroll or slide through comic episodes on any screen."],
            ["Watch", "Stream animation releases with comments and likes."],
            ["Play", "Follow game pages as each world moves toward launch."],
          ].map(([title, copy]) => (
            <div key={title}>
              <h3 className="text-2xl font-black uppercase text-white">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

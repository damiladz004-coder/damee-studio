import Link from "next/link";
import Image from "next/image";
import InteractionPanel from "../../../components/InteractionPanel";
import { getContentBySlug } from "../../../lib/content";
import { demoComicPages } from "../../../lib/demo-data";
import { isSupabaseConfigured, supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

type ComicDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ComicDetailPage({ params }: ComicDetailPageProps) {
  const { slug } = await params;
  const comic = await getContentBySlug("comic", slug);

  if (!comic) {
    return (
      <main className="section-shell">
        <h1 className="text-4xl font-black uppercase">Comic not found</h1>
      </main>
    );
  }

  const { data } = isSupabaseConfigured
    ? await supabase
        .from("comic_pages")
        .select("*")
        .eq("comic_id", comic.id)
        .order("page_number")
    : { data: null };
  const pages = data?.length ? data : demoComicPages;

  return (
    <main>
      <section className="section-shell grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <p className="eyebrow">Comic reader</p>
          <h1 className="mt-3 text-5xl font-black uppercase leading-none text-white">
            {comic.title}
          </h1>
          <p className="mt-5 max-w-3xl text-zinc-400">{comic.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/comics" className="btn btn-secondary">
              Back to comics
            </Link>
            <Link href="/referral" className="btn btn-primary">
              Invite readers
            </Link>
          </div>
        </div>
        <InteractionPanel contentId={comic.id} contentType="comic" />
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="space-y-6">
          {pages.map((page) => (
            <Image
              key={page.id}
              src={page.image_url}
              alt={`${comic.title} page ${page.page_number}`}
              width={1200}
              height={1600}
              className="mx-auto w-full rounded-lg border border-white/10 bg-zinc-950 object-cover"
              sizes="(min-width: 1024px) 960px, 100vw"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

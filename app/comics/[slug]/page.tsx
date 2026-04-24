import ComicExperience from "../../../components/ComicExperience";
import InteractionPanel from "../../../components/InteractionPanel";
import { getContentBySlug } from "../../../lib/content";
import { getComicIssues } from "../../../lib/content";
import { demoComicPages } from "../../../lib/demo-data";

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

  const issues = await getComicIssues(comic.id);

  return (
    <>
      <ComicExperience comic={comic} issues={issues} previewPages={demoComicPages} />
      <section className="section-shell pt-0">
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div />
          <InteractionPanel contentId={comic.id} contentType="comic" />
        </div>
      </section>
    </>
  );
}

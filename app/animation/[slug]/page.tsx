import InteractionPanel from "../../../components/InteractionPanel";
import { getContentBySlug } from "../../../lib/content";

export const dynamic = "force-dynamic";

type AnimationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AnimationDetailPage({
  params,
}: AnimationDetailPageProps) {
  const { slug } = await params;
  const animation = await getContentBySlug("animation", slug);

  if (!animation) {
    return (
      <main className="section-shell">
        <h1 className="text-4xl font-black uppercase">Animation not found</h1>
      </main>
    );
  }

  return (
    <main className="section-shell">
      <div className="section-heading">
        <p className="eyebrow">Animation</p>
        <h1>{animation.title}</h1>
        <p>{animation.description}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <video
          className="aspect-video w-full rounded-lg border border-white/10 bg-black object-cover"
          controls
          poster={animation.thumbnail_url}
          src={animation.media_url}
        />
        <InteractionPanel contentId={animation.id} contentType="animation" />
      </div>
    </main>
  );
}

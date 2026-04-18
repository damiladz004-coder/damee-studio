import ContentCard from "../../components/ContentCard";
import { getContentByKind } from "../../lib/content";

export const dynamic = "force-dynamic";

export default async function AnimationPage() {
  const animations = await getContentByKind("animation");

  return (
    <main className="section-shell">
      <div className="section-heading">
        <p className="eyebrow">Animation</p>
        <h1>Watch the motion cuts</h1>
        <p>
          Stream shorts, trailers, and story sequences from the Damee Studio
          slate.
        </p>
      </div>
      <div className="content-grid">
        {animations.map((animation) => (
          <ContentCard key={animation.id} item={animation} />
        ))}
      </div>
    </main>
  );
}

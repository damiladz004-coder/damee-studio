import ContentCard from "../../components/ContentCard";
import { getContentByKind } from "../../lib/content";

export const dynamic = "force-dynamic";

export default async function ComicsPage() {
  const comics = await getContentByKind("comic");

  return (
    <main className="section-shell">
      <div className="section-heading">
        <p className="eyebrow">Comics</p>
        <h1>Read the universe</h1>
        <p>
          Follow each episode in scroll mode, react to releases, and share your
          referral link when you bring new readers in.
        </p>
      </div>
      <div className="content-grid">
        {comics.map((comic) => (
          <ContentCard key={comic.id} item={comic} />
        ))}
      </div>
    </main>
  );
}

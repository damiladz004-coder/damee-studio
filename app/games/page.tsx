import ContentCard from "../../components/ContentCard";
import { getContentByKind } from "../../lib/content";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const games = await getContentByKind("game");

  return (
    <main className="section-shell">
      <div className="section-heading">
        <p className="eyebrow">Games</p>
        <h1>Play the next chapter</h1>
        <p>
          Track prototypes, playable releases, and game pages tied to each
          Damee story world.
        </p>
      </div>
      <div className="content-grid">
        {games.map((game) => (
          <ContentCard key={game.id} item={game} />
        ))}
      </div>
    </main>
  );
}

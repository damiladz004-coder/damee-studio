import GameExperience from "../../../components/GameExperience";
import { getContentBySlug, getPublishedComicIssues } from "../../../lib/content";

export const dynamic = "force-dynamic";

type GameDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { slug } = await params;
  const game = await getContentBySlug("game", slug);
  const issues = await getPublishedComicIssues();

  if (!game) {
    return (
      <main className="section-shell">
        <h1 className="text-4xl font-black uppercase">Game not found</h1>
      </main>
    );
  }

  return <GameExperience game={game} issues={issues} />;
}

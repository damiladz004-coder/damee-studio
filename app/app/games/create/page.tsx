import ContentForm from "../../../../components/ContentForm";

export default function CreateGamePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Game</h1>
        <p className="text-zinc-400">Add a new game to the platform</p>
      </div>

      <ContentForm contentType="game" />
    </div>
  );
}

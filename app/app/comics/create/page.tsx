import ComicForm from "../../../../components/ComicForm";

export default function CreateComicPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Comic</h1>
        <p className="text-zinc-400">Add a new comic to the platform</p>
      </div>

      <ComicForm />
    </div>
  );
}

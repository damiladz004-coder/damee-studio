import ContentForm from "../../../../components/ContentForm";

export default function CreateAnimationPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Animation</h1>
        <p className="text-zinc-400">Add a new animation to the platform</p>
      </div>

      <ContentForm contentType="animation" />
    </div>
  );
}

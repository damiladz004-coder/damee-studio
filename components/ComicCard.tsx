import Image from "next/image";
import Link from "next/link";

type ComicCardProps = {
  title: string;
  description: string;
  cover: string;
};

export default function ComicCard({
  title,
  description,
  cover,
}: ComicCardProps) {
  return (
    <div className="bg-black/60 border border-gray-800 rounded-xl overflow-hidden hover:border-yellow-500 transition">
      <div className="relative h-56">
        <Image
          src={cover}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="mt-2 text-sm text-gray-400 line-clamp-3">
          {description}
        </p>

        <Link href="/reader" className="mt-4 w-full block">
          <button className="w-full px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold">
            Read Now
          </button>
        </Link>
      </div>
    </div>
  );
}

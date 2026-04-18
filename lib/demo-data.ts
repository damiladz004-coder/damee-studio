import type { ComicPage, ContentItem } from "./types";

export const featuredContent: ContentItem[] = [
  {
    id: "comic-eagles-watch",
    slug: "eagles-watch",
    kind: "comic",
    status: "featured",
    title: "Eagle's Watch",
    description:
      "Teen guardians uncover a hidden signal beneath Lagos and step into a war older than the city.",
    thumbnail_url:
      "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "animation-blue-hour",
    slug: "blue-hour",
    kind: "animation",
    status: "featured",
    title: "Blue Hour",
    description:
      "A motion short following a courier who delivers memories across a neon coast.",
    thumbnail_url:
      "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=900&q=80",
    media_url:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  {
    id: "game-shadow-run",
    slug: "shadow-run",
    kind: "game",
    status: "featured",
    title: "Shadow Run",
    description:
      "A tactical runner prototype set inside the same city mythos as Eagle's Watch.",
    thumbnail_url:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
  },
];

export const demoComicPages: ComicPage[] = [
  {
    id: "page-1",
    comic_id: "comic-eagles-watch",
    page_number: 1,
    image_url:
      "https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "page-2",
    comic_id: "comic-eagles-watch",
    page_number: 2,
    image_url:
      "https://images.unsplash.com/photo-1612036781124-847f8939b154?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "page-3",
    comic_id: "comic-eagles-watch",
    page_number: 3,
    image_url:
      "https://images.unsplash.com/photo-1620421680010-0766ff230392?auto=format&fit=crop&w=1200&q=80",
  },
];

export const getDemoByKind = (kind: ContentItem["kind"]) =>
  featuredContent.filter((item) => item.kind === kind);

export const getDemoBySlug = (slug: string) =>
  featuredContent.find((item) => item.slug === slug);

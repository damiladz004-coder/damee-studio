"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function UploadForm() {
  const [status, setStatus] = useState("");
  const [contentType, setContentType] = useState("comic");
  const [comics, setComics] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    supabase
      .from("comics")
      .select("id, title")
      .order("title", { ascending: true })
      .then(({ data }) => setComics(data ?? []));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: session
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
      body: formData,
    });

    setStatus(response.ok ? "Upload saved" : "Upload failed. Check admin role.");
    if (response.ok) form.reset();
  }

  return (
    <form className="panel space-y-4 p-5" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <input className="field" name="title" placeholder="Title" required />
        <select
          className="field"
          name="contentType"
          value={contentType}
          onChange={(event) => setContentType(event.target.value)}
        >
          <option value="comic">Comic</option>
          <option value="comicIssue">Comic issue</option>
          <option value="animation">Animation</option>
          <option value="game">Game</option>
        </select>
      </div>
      <textarea
        className="field min-h-28"
        name="description"
        placeholder="Description"
        required
      />
      {contentType === "comicIssue" && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <select className="field" name="comicId" required>
              <option value="">Select comic</option>
              {comics.map((comic) => (
                <option key={comic.id} value={comic.id}>
                  {comic.title}
                </option>
              ))}
            </select>
            <input
              className="field"
              name="issueNumber"
              type="number"
              min={1}
              placeholder="Issue number"
              required
            />
            <input
              className="field"
              name="priceNaira"
              type="number"
              min={0}
              step={100}
              placeholder="Price in naira"
              required
            />
          </div>
          <label className="field cursor-pointer">
            Issue pages
            <input className="mt-3 block text-sm" name="pages" type="file" multiple required />
          </label>
        </>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field cursor-pointer">
          Thumbnail
          <input
            className="mt-3 block text-sm"
            name="thumbnail"
            type="file"
            required={contentType !== "comicIssue"}
          />
        </label>
        <label className="field cursor-pointer">
          Media file
          <input
            className="mt-3 block text-sm"
            name="media"
            type="file"
            required={contentType !== "comicIssue"}
          />
        </label>
      </div>
      <button className="btn btn-primary w-full" type="submit">
        {contentType === "comicIssue" ? "Publish issue" : "Publish content"}
      </button>
      {status && <p className="text-sm text-zinc-400">{status}</p>}
    </form>
  );
}

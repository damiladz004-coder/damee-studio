"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function UploadForm() {
  const [status, setStatus] = useState("");

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
        <select className="field" name="contentType" defaultValue="comic">
          <option value="comic">Comic</option>
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
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field cursor-pointer">
          Thumbnail
          <input className="mt-3 block text-sm" name="thumbnail" type="file" />
        </label>
        <label className="field cursor-pointer">
          Media file
          <input className="mt-3 block text-sm" name="media" type="file" />
        </label>
      </div>
      <button className="btn btn-primary w-full" type="submit">
        Publish content
      </button>
      {status && <p className="text-sm text-zinc-400">{status}</p>}
    </form>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { ContentKind } from "../lib/types";

type InteractionPanelProps = {
  contentId: string;
  contentType: ContentKind;
};

export default function InteractionPanel({
  contentId,
  contentType,
}: InteractionPanelProps) {
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");

  async function authHeaders() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session
      ? { Authorization: `Bearer ${session.access_token}` }
      : undefined;
  }

  async function like() {
    const headers = await authHeaders();

    const response = await fetch("/api/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
      },
      body: JSON.stringify({ action: "like", contentId, contentType }),
    });

    setStatus(response.ok ? "Liked" : "Sign in to like this release.");
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const headers = await authHeaders();

    const response = await fetch("/api/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
      },
      body: JSON.stringify({
        action: "comment",
        contentId,
        contentType,
        body: comment,
      }),
    });

    if (response.ok) {
      setComment("");
      setStatus("Comment posted");
    } else {
      setStatus("Sign in to comment.");
    }
  }

  async function share() {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title: "Damee Studio", url });
    } else {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied");
    }
  }

  return (
    <aside className="panel p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button className="btn btn-primary" onClick={like}>
          Like
        </button>
        <button className="btn btn-secondary" onClick={share}>
          Share
        </button>
        <a className="btn btn-secondary" href="#comments">
          Comment
        </a>
      </div>

      <form id="comments" className="mt-5 space-y-3" onSubmit={submitComment}>
        <textarea
          className="field min-h-28 resize-y"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Add a comment"
          required
        />
        <button className="btn btn-primary w-full" type="submit">
          Post comment
        </button>
      </form>

      {status && <p className="mt-4 text-sm text-zinc-400">{status}</p>}
    </aside>
  );
}

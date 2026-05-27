"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";
import { formatNaira } from "../../../../../lib/format";
import type { ComicIssue } from "../../../../../lib/types";

export default function ComicIssuesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [comicTitle, setComicTitle] = useState("");
  const [issues, setIssues] = useState<ComicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    issue_number: "",
    summary: "",
    price_naira: "",
    status: "draft" as "draft" | "published" | "featured",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadComicAndIssues();
  }, [params.id]);

  async function loadComicAndIssues() {
    try {
      const { data: comic } = await supabase
        .from("comics")
        .select("title")
        .eq("id", params.id)
        .single();

      if (comic) {
        setComicTitle(comic.title);
      }

      const { data, error } = await supabase
        .from("comic_issues")
        .select("*")
        .eq("comic_id", params.id)
        .order("issue_number", { ascending: true });

      if (error) throw error;
      setIssues(data ?? []);
    } catch (error) {
      console.error("Failed to load issues:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const issueData = {
        comic_id: params.id,
        title: formData.title,
        slug: `${formData.issue_number}`,
        issue_number: parseInt(formData.issue_number),
        summary: formData.summary,
        price_naira: parseInt(formData.price_naira) || 0,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("comic_issues")
          .update(issueData)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comic_issues")
          .insert(issueData);

        if (error) throw error;
      }

      await loadComicAndIssues();
      resetForm();
    } catch (error) {
      console.error("Failed to save issue:", error);
      alert("Failed to save issue");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (issue: ComicIssue) => {
    setFormData({
      title: issue.title,
      issue_number: issue.issue_number.toString(),
      summary: issue.summary || "",
      price_naira: issue.price_naira.toString(),
      status: issue.status as "draft" | "published" | "featured",
    });
    setEditingId(issue.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;

    try {
      const { error } = await supabase
        .from("comic_issues")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setIssues(issues.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Failed to delete issue:", error);
      alert("Failed to delete issue");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      issue_number: "",
      summary: "",
      price_naira: "",
      status: "draft",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/20 text-green-300";
      case "featured":
        return "bg-yellow-500/20 text-yellow-300";
      case "draft":
        return "bg-zinc-500/20 text-zinc-300";
      default:
        return "bg-zinc-500/20 text-zinc-300";
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/app/comics" className="text-blue-400 hover:text-blue-300 text-sm mb-2 block">
            ← Back to Comics
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{comicTitle} - Issues</h1>
          <p className="text-zinc-400">Manage comic issues and pricing</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            + New Issue
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 mb-8 max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-6">
            {editingId ? "Edit Issue" : "Create Issue"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Issue Number *
              </label>
              <input
                type="number"
                name="issue_number"
                value={formData.issue_number}
                onChange={handleFormChange}
                placeholder="1"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Issue title"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Summary</label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleFormChange}
                placeholder="Issue summary..."
                rows={3}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Price (₦)</label>
              <input
                type="number"
                name="price_naira"
                value={formData.price_naira}
                onChange={handleFormChange}
                placeholder="0"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="featured">Featured</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={formLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
              >
                {formLoading ? "Saving..." : "Save Issue"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-zinc-400">Loading issues...</div>
      ) : issues.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400 mb-4">No issues yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-400 hover:text-blue-300"
          >
            Create the first issue →
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-lg">
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Issue
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-white font-semibold">#{issue.issue_number}</td>
                  <td className="px-6 py-4 text-white">{issue.title}</td>
                  <td className="px-6 py-4 text-white">
                    {issue.price_naira > 0 ? formatNaira(issue.price_naira) : "Free"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}
                    >
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(issue)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(issue.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

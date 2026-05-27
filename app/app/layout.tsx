import AdminProtectedRoute from "../../components/AdminProtectedRoute";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtectedRoute>
      <div className="flex h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-zinc-950">{children}</main>
      </div>
    </AdminProtectedRoute>
  );
}

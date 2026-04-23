import UserForm from "@/components/domain/admin/user-form";

const users = [{ id: "usr_1", full_name: "Ayesha Khan", email: "ayesha.khan@company.com", role: "ADMIN", status: "Active" }];

export default function AdminUsersPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Users</h1></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
        <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Role</th><th className="p-2 text-left">Status</th></tr></thead><tbody>{users.map((u) => <tr key={u.id}><td className="p-2">{u.full_name}</td><td className="p-2">{u.email}</td><td className="p-2">{u.role}</td><td className="p-2">{u.status}</td></tr>)}</tbody></table>
      </section>
      <UserForm submitLabel="Create User" />
    </div></main>
  );
}

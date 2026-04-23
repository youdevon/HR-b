const roles = [
  { id: "SUPER_USER", name: "Super User", description: "Full access" },
  { id: "ADMIN", name: "Admin", description: "Administration and operations" },
  { id: "OFFICER", name: "Officer", description: "Operational access" },
];

export default function AdminRolesPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Roles</h1></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
        <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Role</th><th className="p-2 text-left">Description</th></tr></thead><tbody>{roles.map((r) => <tr key={r.id}><td className="p-2">{r.name}</td><td className="p-2">{r.description}</td></tr>)}</tbody></table>
      </section>
    </div></main>
  );
}

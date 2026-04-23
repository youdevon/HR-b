const permissions = [
  { key: "employees.read", description: "Read employee records", role_count: 4 },
  { key: "contracts.write", description: "Manage contracts", role_count: 3 },
];

export default function AdminPermissionsPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Permissions</h1></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
        <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Permission</th><th className="p-2 text-left">Description</th><th className="p-2 text-left">Roles</th></tr></thead><tbody>{permissions.map((p) => <tr key={p.key}><td className="p-2">{p.key}</td><td className="p-2">{p.description}</td><td className="p-2">{p.role_count}</td></tr>)}</tbody></table>
      </section>
    </div></main>
  );
}

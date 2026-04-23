export default function DashboardPage() {
    return (
      <main className="min-h-screen bg-neutral-100 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Welcome to the HR Management System.
            </p>
          </div>
  
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm text-neutral-500">Active Employees</p>
              <p className="mt-2 text-3xl font-semibold text-neutral-900">0</p>
            </div>
  
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm text-neutral-500">Contracts Expiring</p>
              <p className="mt-2 text-3xl font-semibold text-neutral-900">0</p>
            </div>
  
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm text-neutral-500">Low Sick Leave</p>
              <p className="mt-2 text-3xl font-semibold text-neutral-900">0</p>
            </div>
  
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
              <p className="text-sm text-neutral-500">Active Alerts</p>
              <p className="mt-2 text-3xl font-semibold text-neutral-900">0</p>
            </div>
          </section>
  
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
              <p className="mt-3 text-sm text-neutral-600">
                Activity will appear here once audit logging is connected.
              </p>
            </div>
  
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Quick Actions</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
                  Add Employee
                </button>
                <button className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300">
                  Add Contract
                </button>
                <button className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300">
                  Record Leave
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }
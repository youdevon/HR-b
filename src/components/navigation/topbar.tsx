export default function Topbar() {
    return (
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div>
            <h1 className="text-base font-semibold text-neutral-900">HR Management System</h1>
            <p className="text-sm text-neutral-500">Dashboard workspace</p>
          </div>
  
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Notifications
            </button>
  
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                AD
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-neutral-900">Admin User</p>
                <p className="text-xs text-neutral-500">admin@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }
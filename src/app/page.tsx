// app/page.tsx
import Link from "next/link";
import { Edit as EditIcon, Eye as EyeIcon, ShoppingCart as ShoppingCartIcon } from "lucide-react";

export default function Page() {
  return (
    <main>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Combo Tools</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/edit-combo" className="card bg-base-100 shadow hover:shadow-lg hover:shadow-primary/20 border border-base-200 hover:border-primary/30 transition-all duration-200 group">
            <div className="card-body">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-200">
                  <EditIcon className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="card-title text-lg group-hover:text-primary transition-colors">Edit Combo</h2>
                  <p className="text-sm text-base-content/70 mt-1">Process CSV and store rows globally.</p>
                  <div className="badge badge-primary badge-sm mt-2">Core Feature</div>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/view-production" className="card bg-base-100 shadow hover:shadow-lg hover:shadow-info/20 border border-base-200 hover:border-info/30 transition-all duration-200 group">
            <div className="card-body">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-info/20 to-info/10 rounded-xl group-hover:from-info/30 group-hover:to-info/20 transition-all duration-200">
                  <EyeIcon className="w-7 h-7 text-info" />
                </div>
                <div className="flex-1">
                  <h2 className="card-title text-lg group-hover:text-info transition-colors">View Production</h2>
                  <p className="text-sm text-base-content/70 mt-1">Scrape and view image cards with filters.</p>
                  <div className="badge badge-info badge-sm mt-2">Visualization</div>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/crosssell" className="card bg-base-100 shadow hover:shadow-lg hover:shadow-secondary/20 border border-base-200 hover:border-secondary/30 transition-all duration-200 group">
            <div className="card-body">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-xl group-hover:from-secondary/30 group-hover:to-secondary/20 transition-all duration-200">
                  <ShoppingCartIcon className="w-7 h-7 text-secondary" />
                </div>
                <div className="flex-1">
                  <h2 className="card-title text-lg group-hover:text-secondary transition-colors">Crosssell Management</h2>
                  <p className="text-sm text-base-content/70 mt-1">Manage crosssell product relationships.</p>
                  <div className="badge badge-secondary badge-sm mt-2">Advanced</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}


"use client";

import { Wand2 as Wand2Icon } from "lucide-react";

export function ScrapeHero({
  onScrape,
  loading,
  hasRows,
}: {
  onScrape: () => void;
  loading: boolean;
  hasRows: boolean;
}) {
  return (
    <div className="hero bg-base-200 rounded-box">
      <div className="hero-content text-center">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold">Combo-Guide Image Scraper</h2>
          <p className="py-4 text-base-content/70">
            Paste product URLs. Separate by newline, comma, or space.
          </p>
          <div className="mt-4">
            <button 
              onClick={onScrape} 
              disabled={loading || !hasRows} 
              className="btn btn-primary gap-2"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <Wand2Icon className="w-4 h-4" />
                  Scrape
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



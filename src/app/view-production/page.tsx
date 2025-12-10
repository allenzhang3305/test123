"use client";

import { useState } from "react";
import { Wand2 as Wand2Icon, Image as ImageIcon, ImageOff as ImageOffIcon, Filter as FilterIcon } from "lucide-react";
import { useRowsStore } from "@/stores/useRowsStore";
import type { Dot } from "@/types";
import { ImageCard } from "@/components/ImageCard";

interface Result {
  url: string;
  image: string | null;
  title?: string;
  dots: Dot[];
}

export default function Page() {
  const { rows, results, setResults } = useRowsStore();
  const [loading, setLoading] = useState(false);
  const [imgFilter, setImgFilter] = useState<"all" | "with" | "without">(
    "all"
  );

  const onScrape = async () => {
    const list = rows
      .map((r) => r.url)
      .map((s) => s?.trim())
      .filter(Boolean);
    if (list.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: list }),
      });
      const json = await res.json();
      setResults(json.results ?? []);
    } finally {
      setLoading(false);
    }
  };

  const filteredData =
    imgFilter === "all"
      ? results
      : results.filter((r) => (imgFilter === "with" ? !!r.image : !r.image));

  return (
    <main>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">View Production</h1>
          <button 
            onClick={onScrape} 
            disabled={loading || rows.length === 0} 
            className="btn btn-primary btn-sm gap-2"
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

        <div className="mt-4 flex justify-end">
          <div className="join">
            <button
              className={`btn btn-sm join-item gap-2 ${imgFilter === "all" ? "btn-active" : ""}`}
              onClick={() => setImgFilter("all")}
            >
              <FilterIcon className="w-4 h-4" />
              All
            </button>
            <button
              className={`btn btn-sm join-item gap-2 ${imgFilter === "with" ? "btn-active" : ""}`}
              onClick={() => setImgFilter("with")}
            >
              <ImageIcon className="w-4 h-4" />
              With image
            </button>
            <button
              className={`btn btn-sm join-item gap-2 ${imgFilter === "without" ? "btn-active" : ""}`}
              onClick={() => setImgFilter("without")}
            >
              <ImageOffIcon className="w-4 h-4" />
              No image
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-row flex-wrap gap-8">
          {filteredData.map(({ url, image, title, dots }) => (
            <ImageCard url={url} image={image} title={title} dots={dots} key={url} />
          ))}
        </div>
      </div>
    </main>
  );
}



"use client";

import Image from "next/image";
import { Dot } from "@/types";

export function ImageCard({
  url,
  image,
  title,
  dots,
}: {
  url: string;
  image: string | null;
  title?: string;
  dots?: Dot[];
}) {
  return (
    <div className="card bg-base-100 shadow-xl">
      {/* Combo Image */}
      <figure className="bg-base-200 h-80 min-w-70 relative overflow-hidden self-center">
        {image ? (
          <>
            <div className="relative w-full h-full">
              <Image
                src={image}
                alt={title || url}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            {(dots || []).map((d, i) => (
              <span
                key={i}
                className={`absolute w-3 h-3 bg-white border-red-500 rounded-full border -translate-x-1/2 -translate-y-1/2 shadow`}
                style={{ left: d.left, top: d.top }}
              />
            ))}
          </>
        ) : (
          <div className="text-sm text-base-content/60">No image</div>
        )}
      </figure>

      <div className="card-body p-4 flex-1">
        <div className="card-title line-clamp-2 text-sm text-wrap">
          {title || url}
        </div>

        {/* 3 small images */}

        {/* <div className="card-actions justify-end">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            Open URL
          </a>
        </div> */}
      </div>
    </div>
  );
}



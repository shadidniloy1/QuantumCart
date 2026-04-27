"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export default function ImageGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  function prev() {
    setActive((a) => (a === 0 ? images.length - 1 : a - 1));
  }
  function next() {
    setActive((a) => (a === 0 ? images.length - 1 : a + 1));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group cursor-zoom-in"
        onClick={() => setZoomed(true)}
      >
        <Image
          src={images[active]}
          alt={`${name} - image ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </div>

        {/* Nav arrows - only if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === active ? "bg-white w-4" : "bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-violet-500"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={img}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoomed lightbox */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-2xl w-full aspect-square rounded-2xl overflow-hidden">
            <Image
              src={images[active]}
              alt={name}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}

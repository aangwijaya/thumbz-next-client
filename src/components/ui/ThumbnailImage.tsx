"use client";

import Image from "next/image";
import { useState } from "react";

interface ThumbnailImageProps {
  src: string;
  sizes: string;
  priority?: boolean;
}

/**
 * A thumbnail that steps aside when the remote image cannot load, so the
 * gradient behind it (team/type colours) shows instead of a blank box.
 */
export function ThumbnailImage({ src, sizes, priority = false }: ThumbnailImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

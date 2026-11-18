"use client";

import Image from "next/image";
import { useState } from "react";

export function VideoThumbnail({ local, remote }: { local?: string; remote?: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const src = [local, remote].find(url => url && !failed.includes(url));
  return src ? <Image unoptimized src={src} width={48} height={56} alt="" referrerPolicy="no-referrer"
    className="rank-thumb" onError={() => setFailed(previous => [...previous, src])} /> : null;
}

import { useMemo } from "react";

type MediaItem = { src: string; name: string; type: "image" | "video" };

function nameFromPath(p: string) {
  const parts = p.split("/");
  return parts[parts.length - 1] || p;
}

export default function GalleryPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useMemo(() => {
    const imageMods = import.meta.glob("../../public/media/images/*.{jpg,jpeg,png,webp,gif,avif,JPG,JPEG,PNG,WEBP,GIF,AVIF}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
    const videoMods = import.meta.glob("../../public/media/videos/*.{mp4,webm,mov,MP4,WEBM,MOV}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
    const rootImageMods = import.meta.glob("../../images and videos/*.{jpg,jpeg,png,webp,gif,avif,JPG,JPEG,PNG,WEBP,GIF,AVIF}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
    const rootVideoMods = import.meta.glob("../../images and videos/*.{mp4,webm,mov,MP4,WEBM,MOV}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

    const bySrc = new Map<string, MediaItem>();
    for (const [p, src] of [...Object.entries(imageMods), ...Object.entries(rootImageMods)]) {
      bySrc.set(src, { src, name: nameFromPath(p), type: "image" });
    }
    for (const [p, src] of [...Object.entries(videoMods), ...Object.entries(rootVideoMods)]) {
      bySrc.set(src, { src, name: nameFromPath(p), type: "video" });
    }

    const all = Array.from(bySrc.values());
    const sortByName = (a: MediaItem, b: MediaItem) => a.name.localeCompare(b.name);
    return {
      images: all.filter((i) => i.type === "image").sort(sortByName),
      videos: all.filter((i) => i.type === "video").sort(sortByName),
    };
  }, []);

  if (!open) return null;

  const hasAny = items.images.length > 0 || items.videos.length > 0;

  return (
    <div className="admin-overlay" role="dialog" aria-modal="true" aria-label="Photos and videos gallery">
      <div className="admin-overlay-backdrop" onClick={onClose} />
      <div className="admin-overlay-panel gallery-panel">
        <div className="admin-overlay-head">
          <div>
            <p className="eyebrow">Gallery</p>
            <h2>Photos & Videos</h2>
          </div>
          <button className="btn btn-secondary btn-sm" type="button" onClick={onClose} aria-label="Close gallery">
            Close
          </button>
        </div>

        <p className="section-sub" style={{ textAlign: "left", maxWidth: "none", marginBottom: 24 }}>
          Hamare wedding fruit stall ki photos aur videos yahan dekhein.
        </p>

        {!hasAny ? (
          <div className="admin-empty" style={{ maxWidth: 720, margin: "0 auto" }}>
            <p style={{ margin: 0 }}>
              Abhi koi media nahi hai. Images/videos <strong>images and videos</strong> folder me ya <strong>public/media/images</strong> & <strong>public/media/videos</strong> me daalein — yahan automatically dikh jayengi.
            </p>
          </div>
        ) : null}

        {items.images.length > 0 ? (
          <div style={{ marginBottom: items.videos.length ? 40 : 0 }}>
            <h3 style={{ marginBottom: 16 }}>Images</h3>
            <div className="gallery-grid">
              {items.images.map((item) => (
                <figure className="gallery-card" key={item.src}>
                  <img src={item.src} alt={item.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")} loading="lazy" />
                </figure>
              ))}
            </div>
          </div>
        ) : null}

        {items.videos.length > 0 ? (
          <div>
            <h3 style={{ marginBottom: 16 }}>Videos</h3>
            <div className="gallery-grid">
              {items.videos.map((item) => (
                <figure className="gallery-card" key={item.src}>
                  <video src={item.src} controls playsInline preload="metadata" />
                </figure>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

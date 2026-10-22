import { useState } from "react";
import { ImageViewer } from "./ImageViewer";
import { imageUrl } from "../lib/imagekit";
export type ServicePhotoFields = {
  image?: string;
  images?: readonly { url: string; fileId?: string }[];
};
export function ServicePhotos({
  service,
}: {
  service: ServicePhotoFields & { name: string };
}) {
  const photos = [
    ...new Set(
      [
        service.image,
        ...(service.images ?? []).map((photo) => photo.url),
      ].filter((url): url is string => !!url),
    ),
  ];
  const [selected, setSelected] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <div className="service-photos">
      <div className="service-photo-strip">
        {photos.map((photo, index) => (
          <button
            type="button"
            key={photo}
            aria-label={`View ${service.name} photo ${index + 1}`}
            onClick={() => setSelected(index)}
          >
            <img
              src={imageUrl(photo, index === 0 ? 900 : 180)}
              alt={`${service.name} — photo ${index + 1}`}
              loading="lazy"
            />
          </button>
        ))}
      </div>
      {selected !== null && (
        <ImageViewer
          open
          photos={photos}
          name={service.name}
          index={selected}
          onIndexChange={setSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

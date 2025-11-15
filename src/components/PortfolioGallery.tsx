import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortfolioImage {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  category?: string;
}

interface PortfolioGalleryProps {
  images: PortfolioImage[];
}

export const PortfolioGallery = ({ images }: PortfolioGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No portfolio images yet</p>
      </div>
    );
  }

  const handlePrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % images.length);
  };

  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-border hover:border-primary transition-all"
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={image.image_url}
              alt={image.title || `Portfolio image ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {image.category && (
                  <Badge variant="secondary" className="mb-1 text-xs">
                    {image.category}
                  </Badge>
                )}
                {image.title && (
                  <p className="text-white text-sm font-medium line-clamp-2">
                    {image.title}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedIndex(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              <img
                src={selectedImage.image_url}
                alt={selectedImage.title || "Portfolio image"}
                className="w-full max-h-[70vh] object-contain bg-black"
              />

              {(selectedImage.title || selectedImage.description || selectedImage.category) && (
                <div className="p-6 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    {selectedImage.title && (
                      <h3 className="text-xl font-semibold">{selectedImage.title}</h3>
                    )}
                    {selectedImage.category && (
                      <Badge variant="secondary">{selectedImage.category}</Badge>
                    )}
                  </div>
                  {selectedImage.description && (
                    <p className="text-muted-foreground">{selectedImage.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Image {(selectedIndex || 0) + 1} of {images.length}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

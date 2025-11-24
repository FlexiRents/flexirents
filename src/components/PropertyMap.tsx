import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin } from 'lucide-react';

interface PropertyMapProps {
  location: string;
  region: string;
}

const PropertyMap = ({ location, region }: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Set Mapbox token from environment variable
    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    
    if (!token) {
      setError('Map configuration is missing. Please contact support.');
      setLoading(false);
      return;
    }

    mapboxgl.accessToken = token;

    const address = `${location}, ${region}, Ghana`;

    // Geocode the address to get coordinates
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${token}&country=GH`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;

          // Initialize map
          map.current = new mapboxgl.Map({
            container: mapContainer.current!,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [lng, lat],
            zoom: 14,
          });

          // Add navigation controls
          map.current.addControl(
            new mapboxgl.NavigationControl({
              visualizePitch: true,
            }),
            'top-right'
          );

          // Add marker for property location
          new mapboxgl.Marker({ color: '#1a365d' })
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<strong>${location}</strong><br/>${region}, Ghana`
              )
            )
            .addTo(map.current);

          setLoading(false);
        } else {
          setError(`Location not found: ${address}`);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Geocoding error:', err);
        setError('Failed to load map. Please try again later.');
        setLoading(false);
      });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [location, region]);

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-[400px] rounded-lg shadow-md"
    />
  );
};

export default PropertyMap;

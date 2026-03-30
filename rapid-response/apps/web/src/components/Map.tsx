import { useEffect, useRef } from 'react';
import mapboxgl, { Map as MapGL, GeoJSONSource, LngLatLike } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Incident } from '@rapid-response/contracts';
import supercluster from 'supercluster';
import { Feature, Point, FeatureCollection } from 'geojson';

type Props = {
  incidents: Incident[];
};

export const Map = ({ incidents }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapGL | null>(null);
  const clusterRef = useRef<supercluster.Supercluster<any, any> | null>(null);

  // initialise map once
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [0, 0],
      zoom: 2,
    });

    map.on('load', () => {
      map.addSource('incidents', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'incidents',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#f28cb1',
          'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'incidents',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'incidents',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      });
    });

    mapRef.current = map;

    return () => map.remove();
  }, []);

  // update source when incidents change
  useEffect(() => {
    if (!mapRef.current) return;
    const source = mapRef.current.getSource('incidents') as GeoJSONSource;
    if (!source) return;

    const features: Feature<Point>[] = incidents.map((i) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: i.location.coordinates,
      },
      properties: {
        incidentId: i.id,
        title: i.title,
        severity: i.severity,
        category: i.category,
      },
    }));

    const fc: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    source.setData(fc);
  }, [incidents]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};

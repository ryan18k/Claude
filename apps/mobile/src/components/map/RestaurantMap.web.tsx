/**
 * Version web de la carte (MapLibre GL JS).
 * Sert uniquement à l'aperçu dans un navigateur (captures d'écran, tests) :
 * l'app Swiss Halal est une app mobile. Mêmes données, mêmes couches que la
 * carte native (voir mapConfig.ts).
 */
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  AttributionControl,
  Map as MapLibreMap,
  type AddLayerObject,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type MapMouseEvent,
} from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
import { useColors } from '@/theme';
import {
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  FIT_PADDING,
  INITIAL_CENTER,
  INITIAL_ZOOM,
  MAP_ATTRIBUTION,
  MAP_STYLE_URL,
  initialBounds,
  markerLayers,
  toFeatureCollection,
  USER_LAYER,
  userFeature,
  type RestaurantMapProps,
} from './mapConfig';

export const mapAvailable = true;

export function RestaurantMap({
  restaurants,
  selectedId,
  onSelect,
  userPosition,
  focus,
}: RestaurantMapProps) {
  const colors = useColors();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const loaded = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const data = useMemo(() => toFeatureCollection(restaurants), [restaurants]);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Création de la carte (une seule fois).
  useEffect(() => {
    if (!container.current) return;
    const bounds = initialBounds(restaurants);
    const instance = new MapLibreMap({
      container: container.current,
      style: MAP_STYLE_URL,
      ...(bounds
        ? {
            bounds: [bounds[0], bounds[1], bounds[2], bounds[3]],
            fitBoundsOptions: { padding: FIT_PADDING },
          }
        : { center: [INITIAL_CENTER.lng, INITIAL_CENTER.lat], zoom: INITIAL_ZOOM }),
      attributionControl: false,
    });
    // Attribution obligatoire (swisstopo), en bas à gauche pour ne pas gêner les boutons.
    instance.addControl(
      new AttributionControl({ compact: true, customAttribution: MAP_ATTRIBUTION }),
      'bottom-left',
    );
    map.current = instance;
    const layers = markerLayers(colors.primary, colors.background, null);

    instance.on('load', () => {
      instance.addSource('restaurants', {
        type: 'geojson',
        data: dataRef.current,
        cluster: true,
        clusterRadius: CLUSTER_RADIUS,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
      });
      for (const layer of [layers.clusters, layers.clusterCount, layers.points, layers.selected]) {
        instance.addLayer({ ...layer, source: 'restaurants' } as AddLayerObject);
      }
      instance.addSource('user', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      instance.addLayer({ ...USER_LAYER, source: 'user' } as AddLayerObject);
      loaded.current = true;
    });

    instance.on('click', (event: MapMouseEvent) => {
      const [feature]: MapGeoJSONFeature[] = instance.queryRenderedFeatures(event.point, {
        layers: ['clusters', 'points'],
      });
      if (!feature || feature.geometry.type !== 'Point') {
        onSelectRef.current(null);
        return;
      }
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const clusterId = feature.properties?.cluster_id as number | undefined;
      if (clusterId !== undefined) {
        const source = instance.getSource('restaurants') as GeoJSONSource;
        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
          instance.easeTo({ center: [lng, lat], zoom });
        });
        return;
      }
      onSelectRef.current((feature.properties?.id as string | undefined) ?? null);
    });

    for (const layer of ['clusters', 'points']) {
      instance.on('mouseenter', layer, () => (instance.getCanvas().style.cursor = 'pointer'));
      instance.on('mouseleave', layer, () => (instance.getCanvas().style.cursor = ''));
    }

    return () => instance.remove();
    // Volontairement exécuté une seule fois : les couleurs sont lues à la création.
  }, []);

  // Mise à jour des restaurants affichés (après un filtre).
  useEffect(() => {
    if (loaded.current)
      (map.current?.getSource('restaurants') as GeoJSONSource | undefined)?.setData(data);
  }, [data]);

  // Mise en évidence du restaurant sélectionné.
  useEffect(() => {
    if (!loaded.current) return;
    const { selected } = markerLayers(colors.primary, colors.background, selectedId);
    map.current?.setFilter('selected', selected.filter as Parameters<MapLibreMap['setFilter']>[1]);
  }, [selectedId, colors.primary, colors.background]);

  // Position de l'utilisateur.
  useEffect(() => {
    if (!loaded.current || !userPosition) return;
    (map.current?.getSource('user') as GeoJSONSource | undefined)?.setData(
      userFeature(userPosition),
    );
  }, [userPosition]);

  // Recentrage demandé.
  useEffect(() => {
    if (focus)
      map.current?.flyTo({ center: [focus.center.lng, focus.center.lat], zoom: focus.zoom });
  }, [focus]);

  return <div ref={container} style={{ position: 'absolute', inset: 0 }} />;
}

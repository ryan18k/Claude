/**
 * Carte native iOS / Android (MapLibre Native).
 * Ce fichier n'est chargé que dans une « development build » ou l'app publiée :
 * le module natif de carte n'existe pas dans Expo Go.
 */
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type CameraRef,
  type GeoJSONSourceRef,
  type LayerProps,
  type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, type NativeSyntheticEvent } from 'react-native';
import { useColors } from '@/theme';
import {
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  FIT_PADDING,
  INITIAL_CENTER,
  INITIAL_ZOOM,
  MAP_STYLE_URL,
  initialBounds,
  markerLayers,
  toFeatureCollection,
  USER_LAYER,
  userFeature,
  type RestaurantMapProps,
} from './mapConfig';

export function NativeMap({
  restaurants,
  selectedId,
  onSelect,
  userPosition,
  focus,
  bottomInset,
}: RestaurantMapProps) {
  const colors = useColors();
  const camera = useRef<CameraRef>(null);
  const source = useRef<GeoJSONSourceRef>(null);
  const data = useMemo(() => toFeatureCollection(restaurants), [restaurants]);
  const layers = markerLayers(colors.primary, colors.background, selectedId);
  // Cadrage de départ calculé une seule fois, à l'affichage de la carte.
  const [startBounds] = useState(() => initialBounds(restaurants));

  // Recentrage demandé (ex. « Me localiser »).
  useEffect(() => {
    if (!focus) return;
    camera.current?.flyTo({
      center: [focus.center.lng, focus.center.lat],
      zoom: focus.zoom,
      duration: 800,
    });
  }, [focus]);

  async function handlePress(event: NativeSyntheticEvent<PressEventWithFeatures>) {
    event.stopPropagation(); // sinon la carte reçoit aussi le clic et désélectionne
    const feature = event.nativeEvent.features[0];
    if (!feature || feature.geometry.type !== 'Point') return;
    const [lng, lat] = feature.geometry.coordinates as [number, number];
    const clusterId = feature.properties?.cluster_id as number | undefined;
    if (clusterId !== undefined) {
      // Groupe de restaurants : on zoome juste assez pour le séparer.
      const zoom = await source.current?.getClusterExpansionZoom(clusterId);
      camera.current?.easeTo({ center: [lng, lat], zoom: zoom ?? INITIAL_ZOOM + 2, duration: 500 });
      return;
    }
    onSelect((feature.properties?.id as string | undefined) ?? null);
  }

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={MAP_STYLE_URL}
      logo={false}
      compass={false}
      attribution
      attributionPosition={{ bottom: bottomInset, left: 8 }}
      onPress={() => onSelect(null)}
    >
      <Camera
        ref={camera}
        initialViewState={
          startBounds
            ? { bounds: startBounds, padding: FIT_PADDING }
            : { center: [INITIAL_CENTER.lng, INITIAL_CENTER.lat], zoom: INITIAL_ZOOM }
        }
      />
      <GeoJSONSource
        id="restaurants"
        ref={source}
        data={data}
        cluster
        clusterRadius={CLUSTER_RADIUS}
        clusterMaxZoom={CLUSTER_MAX_ZOOM}
        onPress={handlePress}
      >
        <Layer {...(layers.clusters as LayerProps)} />
        <Layer {...(layers.clusterCount as LayerProps)} />
        <Layer {...(layers.points as LayerProps)} />
        <Layer {...(layers.selected as LayerProps)} />
      </GeoJSONSource>
      {userPosition && (
        <GeoJSONSource id="user" data={userFeature(userPosition)}>
          <Layer {...(USER_LAYER as LayerProps)} />
        </GeoJSONSource>
      )}
    </Map>
  );
}

/**
 * Ouvre l'itinéraire dans l'app de navigation du téléphone.
 * C'est un simple lien sortant avec les coordonnées : on ne récupère aucune
 * donnée d'un service tiers (conforme aux conditions de Google Maps, par exemple).
 */
import type { LatLng } from '@swisshalal/core';
import { Linking, Platform } from 'react-native';

export function directionsUrl(destination: LatLng, label: string): string {
  const { lat, lng } = destination;
  if (Platform.OS === 'ios') return `https://maps.apple.com/?daddr=${lat},${lng}`;
  // Android : propose toutes les apps de navigation installées (Google Maps, Waze…).
  if (Platform.OS === 'android') return `geo:0,0?q=${lat},${lng}(${encodeURIComponent(label)})`;
  return `https://www.openstreetmap.org/directions?route=%3B${lat}%2C${lng}`;
}

export function openDirections(destination: LatLng, label: string): void {
  void Linking.openURL(directionsUrl(destination, label));
}

export function callPhone(phone: string): void {
  void Linking.openURL(`tel:${phone}`);
}

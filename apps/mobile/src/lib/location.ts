/**
 * Position de l'utilisateur.
 *
 * Vie privée : la permission n'est demandée que lorsque l'utilisateur appuie sur
 * « Me localiser » ou choisit un filtre de distance. La position sert uniquement
 * à trier et filtrer sur le téléphone : elle n'est ni enregistrée ni envoyée au serveur.
 * Le texte affiché par le système est défini dans app.json (plugin expo-location).
 */
import type { LatLng } from '@swisshalal/core';
import * as Location from 'expo-location';

export type LocationResult =
  { status: 'granted'; position: LatLng } | { status: 'denied' } | { status: 'error' };

export async function requestCurrentPosition(): Promise<LocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return { status: 'denied' };
    const current = await Location.getCurrentPositionAsync({
      // Précision « équilibrée » : suffisante pour une distance, moins gourmande en batterie.
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      status: 'granted',
      position: { lat: current.coords.latitude, lng: current.coords.longitude },
    };
  } catch {
    return { status: 'error' };
  }
}

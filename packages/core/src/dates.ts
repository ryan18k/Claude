/**
 * Petites fonctions de dates, sans dépendance externe.
 *
 * Toutes les dates « calendrier » (sans heure) sont des chaînes ISO « AAAA-MM-JJ ».
 * On évite `new Date('2026-10-04')` pour comparer des jours : selon le fuseau
 * horaire de l'appareil, on pourrait se retrouver la veille.
 */

export const SWISS_TIME_ZONE = 'Europe/Zurich';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Vérifie qu'une chaîne est une date ISO valide (AAAA-MM-JJ). */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Date du jour (AAAA-MM-JJ) dans un fuseau horaire donné, par défaut la Suisse. */
export function isoDateInZone(instant: Date, timeZone: string = SWISS_TIME_ZONE): string {
  const parts = zonedParts(instant, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** Ajoute (ou retire) un nombre de jours à une date ISO. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Formate une date ISO au format suisse JJ.MM.AAAA. */
export function formatDateCH(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** Jour ISO : 1 = lundi … 7 = dimanche. */
  isoWeekday: number;
}

const WEEKDAYS: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/**
 * Décompose un instant en date et heure locales d'un fuseau horaire.
 * Intl gère les changements d'heure été/hiver à notre place.
 */
export function zonedParts(instant: Date, timeZone: string = SWISS_TIME_ZONE): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const map: Record<string, string> = {};
  for (const part of formatter.formatToParts(instant)) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    isoWeekday: WEEKDAYS[map.weekday ?? ''] ?? 1,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Nom du jour de la semaine dans une langue (1 = lundi … 7 = dimanche). */
export function weekdayName(isoWeekday: number, locale: string): string {
  // Le 5 janvier 2026 est un lundi : on part de là.
  const date = new Date(Date.UTC(2026, 0, 4 + isoWeekday, 12));
  return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(date);
}

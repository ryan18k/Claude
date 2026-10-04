/**
 * Horaires d'ouverture et calcul de « ouvert maintenant ».
 *
 * Règles :
 * - Les heures sont en heure locale suisse (Europe/Zurich), format « HH:MM ».
 * - Si l'heure de fermeture est inférieure ou égale à l'heure d'ouverture,
 *   la plage se termine le lendemain (ex. 18:00 → 02:00, ou 18:00 → 00:00).
 *   « 00:00 → 00:00 » signifie ouvert 24 h.
 * - Un horaire exceptionnel (jour férié, Ramadan, vacances) remplace
 *   complètement l'horaire habituel du jour concerné.
 */
import { addDays, SWISS_TIME_ZONE, zonedParts } from './dates';

export interface TimeRange {
  opens: string; // "HH:MM"
  closes: string; // "HH:MM"
}

export interface OpeningPeriod extends TimeRange {
  /** Jour ISO : 1 = lundi … 7 = dimanche. */
  isoWeekday: number;
}

export interface SpecialDay {
  /** Date ISO « AAAA-MM-JJ ». */
  date: string;
  /** true = fermé toute la journée (les plages sont alors ignorées). */
  closed: boolean;
  ranges: TimeRange[];
}

export interface WeeklySchedule {
  periods: OpeningPeriod[];
  specialDays: SpecialDay[];
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Convertit « HH:MM » en minutes depuis minuit. Lève une erreur si le format est invalide. */
export function toMinutes(time: string): number {
  const match = TIME.exec(time);
  if (!match) throw new Error(`Heure invalide : "${time}" (format attendu HH:MM)`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Une plage qui « déborde » sur le lendemain. */
function isOvernight(range: TimeRange): boolean {
  return toMinutes(range.closes) <= toMinutes(range.opens);
}

/** Plages applicables à une date donnée (horaire exceptionnel prioritaire). */
function rangesForDate(schedule: WeeklySchedule, isoDate: string, isoWeekday: number): TimeRange[] {
  const special = schedule.specialDays.find((day) => day.date === isoDate);
  if (special) return special.closed ? [] : special.ranges;
  return schedule.periods.filter((period) => period.isoWeekday === isoWeekday);
}

/**
 * Le restaurant est-il ouvert à cet instant ?
 * @param instant  l'instant à tester (par défaut : maintenant)
 */
export function isOpenAt(
  schedule: WeeklySchedule,
  instant: Date = new Date(),
  timeZone: string = SWISS_TIME_ZONE,
): boolean {
  const now = zonedParts(instant, timeZone);
  const minutes = now.hour * 60 + now.minute;
  const today = `${now.year}-${String(now.month).padStart(2, '0')}-${String(now.day).padStart(2, '0')}`;
  const yesterday = addDays(today, -1);
  const yesterdayWeekday = now.isoWeekday === 1 ? 7 : now.isoWeekday - 1;

  // 1. Plages qui commencent aujourd'hui.
  for (const range of rangesForDate(schedule, today, now.isoWeekday)) {
    const opens = toMinutes(range.opens);
    const closes = toMinutes(range.closes);
    if (isOvernight(range)) {
      if (minutes >= opens) return true;
    } else if (minutes >= opens && minutes < closes) {
      return true;
    }
  }

  // 2. Plages commencées hier qui se prolongent après minuit.
  for (const range of rangesForDate(schedule, yesterday, yesterdayWeekday)) {
    if (isOvernight(range) && minutes < toMinutes(range.closes)) return true;
  }

  return false;
}

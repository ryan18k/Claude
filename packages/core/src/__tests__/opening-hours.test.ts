import { describe, expect, it } from 'vitest';
import { isOpenAt, toMinutes, type WeeklySchedule } from '../opening-hours';

/** Raccourci : construit un horaire pour un seul jour de la semaine. */
function schedule(
  isoWeekday: number,
  ranges: Array<[string, string]>,
  specialDays: WeeklySchedule['specialDays'] = [],
): WeeklySchedule {
  return {
    periods: ranges.map(([opens, closes]) => ({ isoWeekday, opens, closes })),
    specialDays,
  };
}

// Repères (heure d'été en octobre 2026 : Zurich = UTC+2).
// Lundi 5 octobre 2026 ; samedi 10 octobre 2026.
const at = (isoUtc: string) => new Date(isoUtc);

describe('toMinutes', () => {
  it('convertit HH:MM en minutes', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('11:30')).toBe(690);
    expect(toMinutes('23:59')).toBe(1439);
  });

  it('refuse les formats invalides', () => {
    expect(() => toMinutes('24:00')).toThrow();
    expect(() => toMinutes('9:00')).toThrow();
    expect(() => toMinutes('12h00')).toThrow();
  });
});

describe('isOpenAt', () => {
  const lunchAndDinnerMonday = schedule(1, [
    ['11:30', '14:00'],
    ['18:00', '22:00'],
  ]);

  it('ouvert pendant une plage, fermé entre deux plages', () => {
    expect(isOpenAt(lunchAndDinnerMonday, at('2026-10-05T10:00:00Z'))).toBe(true); // 12:00
    expect(isOpenAt(lunchAndDinnerMonday, at('2026-10-05T13:00:00Z'))).toBe(false); // 15:00
    expect(isOpenAt(lunchAndDinnerMonday, at('2026-10-05T18:30:00Z'))).toBe(true); // 20:30
  });

  it("l'heure de fermeture est exclue", () => {
    expect(isOpenAt(lunchAndDinnerMonday, at('2026-10-05T12:00:00Z'))).toBe(false); // 14:00 pile
  });

  it('gère les plages qui passent minuit (vendredi 18:00 → samedi 02:00)', () => {
    const friday = schedule(5, [['18:00', '02:00']]);
    expect(isOpenAt(friday, at('2026-10-09T21:00:00Z'))).toBe(true); // ven. 23:00
    expect(isOpenAt(friday, at('2026-10-09T23:30:00Z'))).toBe(true); // sam. 01:30
    expect(isOpenAt(friday, at('2026-10-10T00:00:00Z'))).toBe(false); // sam. 02:00
    expect(isOpenAt(friday, at('2026-10-10T15:00:00Z'))).toBe(false); // sam. 17:00
  });

  it('« 18:00 → 00:00 » ferme à minuit', () => {
    const monday = schedule(1, [['18:00', '00:00']]);
    expect(isOpenAt(monday, at('2026-10-05T21:59:00Z'))).toBe(true); // lun. 23:59
    expect(isOpenAt(monday, at('2026-10-05T22:00:00Z'))).toBe(false); // mar. 00:00
  });

  it('« 00:00 → 00:00 » signifie ouvert 24 h', () => {
    const monday = schedule(1, [['00:00', '00:00']]);
    expect(isOpenAt(monday, at('2026-10-04T22:30:00Z'))).toBe(true); // lun. 00:30
    expect(isOpenAt(monday, at('2026-10-05T21:30:00Z'))).toBe(true); // lun. 23:30
    expect(isOpenAt(monday, at('2026-10-05T22:30:00Z'))).toBe(false); // mar. 00:30
  });

  it('un jour exceptionnel fermé remplace l’horaire habituel', () => {
    const closedMonday = schedule(
      1,
      [['11:00', '22:00']],
      [{ date: '2026-10-05', closed: true, ranges: [] }],
    );
    expect(isOpenAt(closedMonday, at('2026-10-05T10:00:00Z'))).toBe(false);
  });

  it('un horaire exceptionnel (ex. Ramadan) remplace l’horaire habituel', () => {
    const ramadan = schedule(
      1,
      [['11:00', '14:00']],
      [{ date: '2026-10-05', closed: false, ranges: [{ opens: '19:00', closes: '03:00' }] }],
    );
    expect(isOpenAt(ramadan, at('2026-10-05T10:00:00Z'))).toBe(false); // 12:00 : fermé ce jour-là
    expect(isOpenAt(ramadan, at('2026-10-05T23:00:00Z'))).toBe(true); // mar. 01:00
  });

  it('tient compte du passage à l’heure d’été (29 mars 2026)', () => {
    const saturdayAndSunday: WeeklySchedule = {
      periods: [
        { isoWeekday: 6, opens: '12:00', closes: '14:00' },
        { isoWeekday: 7, opens: '12:00', closes: '14:00' },
      ],
      specialDays: [],
    };
    // Samedi 28 mars : heure d'hiver, UTC+1 → 11:30 UTC = 12:30 local.
    expect(isOpenAt(saturdayAndSunday, at('2026-03-28T11:30:00Z'))).toBe(true);
    // Dimanche 29 mars : heure d'été, UTC+2 → 10:30 UTC = 12:30 local.
    expect(isOpenAt(saturdayAndSunday, at('2026-03-29T10:30:00Z'))).toBe(true);
    // Dimanche 29 mars : 12:30 UTC = 14:30 local → fermé.
    expect(isOpenAt(saturdayAndSunday, at('2026-03-29T12:30:00Z'))).toBe(false);
  });
});

describe('weekdayName', () => {
  it('donne le nom du jour dans la langue demandée', async () => {
    const { weekdayName } = await import('../dates');
    expect(weekdayName(1, 'fr-CH')).toBe('lundi');
    expect(weekdayName(7, 'fr-CH')).toBe('dimanche');
    expect(weekdayName(3, 'de-CH')).toBe('Mittwoch');
  });
});

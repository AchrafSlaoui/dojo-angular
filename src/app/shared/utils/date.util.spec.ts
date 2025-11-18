import { daysAgo, formatDate, todayISO, weekRange } from './date.util';

describe('date.util', () => {
  describe('todayISO', () => {
    it('formats the provided reference date in ISO format', () => {
      // Given a specific reference date
      const ref = new Date(2024, 4, 5, 10, 0, 0);
      // When todayISO is invoked with that reference
      const result = todayISO(ref);
      // Then the ISO date string matches the reference date
      expect(result).toBe('2024-05-05');
    });

    it('uses the current system date when no reference is provided', () => {
      // Given the system clock is frozen
      const fixedNow = new Date(2023, 8, 17, 9, 30, 0);
      jest.useFakeTimers();
      try {
        jest.setSystemTime(fixedNow);
        // When todayISO is invoked without a reference
        const result = todayISO();
        // Then the ISO date corresponds to the frozen clock
        expect(result).toBe('2023-09-17');
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('weekRange', () => {
    it('computes the monday and sunday for the provided date', () => {
      // Given a reference date in the middle of the week
      const { monday, sunday } = weekRange(new Date(2024, 0, 3, 14, 0, 0)); // Wednesday

      // When inspecting the computed range
      // Then the boundaries cover the full week
      expect(monday.getFullYear()).toBe(2024);
      expect(monday.getMonth()).toBe(0);
      expect(monday.getDate()).toBe(1);
      expect(monday.getHours()).toBe(0);
      expect(monday.getMinutes()).toBe(0);
      expect(monday.getSeconds()).toBe(0);
      expect(monday.getMilliseconds()).toBe(0);

      expect(sunday.getFullYear()).toBe(2024);
      expect(sunday.getMonth()).toBe(0);
      expect(sunday.getDate()).toBe(7);
      expect(sunday.getHours()).toBe(23);
      expect(sunday.getMinutes()).toBe(59);
      expect(sunday.getSeconds()).toBe(59);
      expect(sunday.getMilliseconds()).toBe(999);
    });

    it('treats sunday as the end of the computed week', () => {
      // Given a reference date that falls on a Sunday
      const { monday, sunday } = weekRange(new Date(2024, 0, 7, 10, 0, 0)); // Sunday

      // When evaluating the week range boundaries
      // Then monday is day 1 and sunday ends the week
      expect(monday.getDate()).toBe(1);
      expect(monday.getDay()).toBe(1);
      expect(sunday.getDate()).toBe(7);
      expect(sunday.getDay()).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('delegates to todayISO for formatting', () => {
      // Given a reference date
      const ref = new Date(2022, 10, 12, 16, 45, 0);
      // When formatDate is invoked
      const result = formatDate(ref);
      // Then the iso string matches todayISO output
      expect(result).toBe('2022-11-12');
    });
  });

  describe('daysAgo', () => {
    it('returns a new date shifted by the requested number of days', () => {
      // Given a reference date with time components
      const ref = new Date(2024, 0, 10, 13, 20, 30, 400);
      // When daysAgo is invoked with an offset
      const result = daysAgo(3, ref);

      // Then the returned date is shifted without mutating the original
      expect(result).not.toBe(ref);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(7);
      expect(result.getHours()).toBe(13);
      expect(result.getMinutes()).toBe(20);
      expect(result.getSeconds()).toBe(30);
      expect(result.getMilliseconds()).toBe(400);
      expect(ref.getDate()).toBe(10);
    });

    it('uses the current system date when no reference is provided', () => {
      // Given the system clock is mocked to a specific instant
      const fixedNow = new Date(2024, 5, 15, 12, 0, 0);
      jest.useFakeTimers();
      try {
        jest.setSystemTime(fixedNow);
        // When daysAgo is called without a reference date
        const result = daysAgo(5);

        // Then the returned date is relative to the mocked clock
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(5);
        expect(result.getDate()).toBe(10);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});

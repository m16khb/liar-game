/**
 * Global dayjs configuration
 * Centralized dayjs plugin setup for consistent date/time handling
 *
 * This configuration should be imported once at the application entry point (main.ts)
 * to ensure all dayjs instances have the same plugins loaded.
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';

/**
 * Initialize dayjs with all required plugins
 *
 * Plugins:
 * - utc: UTC time handling
 * - timezone: Timezone conversion (especially for KST)
 * - duration: Duration calculations
 * - customParseFormat: Custom date format parsing
 * - isSameOrBefore: Comparison utility
 * - isSameOrAfter: Comparison utility
 * - isBetween: Range checking utility
 */
export function configureDayjs(): void {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(duration);
  dayjs.extend(customParseFormat);
  dayjs.extend(isSameOrBefore);
  dayjs.extend(isSameOrAfter);
  dayjs.extend(isBetween);
}

// Re-export dayjs for convenience
export { dayjs };
export default dayjs;

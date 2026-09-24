/**
 * Application-wide behavior and presentation settings.
 * Machine-specific facts belong in machine-config.js.
 */
window.APP_CONFIG = {
  /** Visible time range before and after the requested finish time, in minutes. */
  overviewWindowMin: 60,
  /** Space between the selected timeline point and the scrub overlay, in pixels. */
  scrubOverlayGapPx: 16,
  /** Colors assigned to programs by their order in the active machine profile. */
  programColors: ['#3d9a4a', '#2f83c5', '#e85d4a', '#8b5cb8'],
};

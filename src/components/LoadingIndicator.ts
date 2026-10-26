/**
 * LoadingIndicator — UI component for showing/hiding a loading state.
 *
 * Responsibilities:
 *  - Render a loading indicator element into a given container.
 *  - Expose `show()` to make the indicator visible while a request is in progress.
 *  - Expose `hide()` to remove the indicator from view once a response or error arrives.
 *
 * The indicator is hidden by default (aria-hidden="true", display: none via CSS class).
 *
 * Requirements: 1.5, 4.5
 */

/**
 * Creates and mounts a `LoadingIndicator` inside the given container element.
 *
 * @param container - The DOM element that will host the loading indicator.
 * @returns An object with `show()` and `hide()` methods.
 *
 * @example
 * const zone = document.getElementById('loading-zone')!;
 * const loader = createLoadingIndicator(zone);
 * loader.show();   // visible while fetching
 * loader.hide();   // hidden once done
 */
export function createLoadingIndicator(container: HTMLElement): {
  show: () => void;
  hide: () => void;
} {
  // ── Build the DOM structure ───────────────────────────────────────────────
  const indicator = document.createElement('div');
  indicator.className = 'loading-indicator loading-indicator--hidden';
  indicator.setAttribute('role', 'status');
  indicator.setAttribute('aria-live', 'polite');
  indicator.setAttribute('aria-label', 'Cargando…');
  indicator.setAttribute('aria-hidden', 'true');

  const spinner = document.createElement('span');
  spinner.className = 'loading-indicator__spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'loading-indicator__text';
  text.textContent = 'Cargando…';

  indicator.appendChild(spinner);
  indicator.appendChild(text);
  container.appendChild(indicator);

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Makes the loading indicator visible and announces it to assistive technologies.
   * Requirements: 1.5, 4.5
   */
  function show(): void {
    indicator.classList.remove('loading-indicator--hidden');
    indicator.setAttribute('aria-hidden', 'false');
  }

  /**
   * Hides the loading indicator once a response or error has been received.
   * Requirements: 4.5
   */
  function hide(): void {
    indicator.classList.add('loading-indicator--hidden');
    indicator.setAttribute('aria-hidden', 'true');
  }

  return { show, hide };
}

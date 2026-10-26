/**
 * ErrorMessage — UI component for displaying error messages.
 *
 * Responsibilities:
 *  - Render a descriptive error message string into the designated error zone.
 *  - Expose a `clear()` method to remove any previously shown message.
 *  - Keep City_Input accessible after any error (no disabling of the input).
 *
 * Requirements: 1.3, 1.4, 1.6, 2.3, 2.4, 3.3, 3.4, 3.5
 */

export class ErrorMessage {
  private readonly container: HTMLElement;

  /**
   * @param container - The DOM element that acts as the error message zone.
   *                    Its content will be managed entirely by this component.
   */
  constructor(container: HTMLElement) {
    this.container = container;
    // Ensure the container has the right ARIA role for screen readers.
    this.container.setAttribute('role', 'alert');
    this.container.setAttribute('aria-live', 'polite');
    // Start hidden — no message to show yet.
    this.container.hidden = true;
  }

  /**
   * Renders an error message inside the container and makes it visible.
   *
   * @param message - The human-readable error string to display.
   */
  show(message: string): void {
    // Use textContent (not innerHTML) to avoid XSS risks with arbitrary strings.
    this.container.textContent = message;
    this.container.hidden = false;
  }

  /**
   * Clears any previously displayed error message and hides the container.
   */
  clear(): void {
    this.container.textContent = '';
    this.container.hidden = true;
  }
}

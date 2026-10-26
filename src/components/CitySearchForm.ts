/**
 * CitySearchForm component.
 *
 * Renders the city name input field and submit button, handles validation,
 * and emits a trimmed city name to the provided `onSearch` callback.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

export interface CitySearchFormOptions {
  /** Called with the trimmed city name when a valid search is submitted. */
  onSearch: (cityName: string) => void;
}

export class CitySearchForm {
  private readonly form: HTMLFormElement;
  private readonly input: HTMLInputElement;
  private readonly button: HTMLButtonElement;
  private readonly validationMessage: HTMLSpanElement;
  private readonly onSearch: (cityName: string) => void;

  constructor(options: CitySearchFormOptions) {
    this.onSearch = options.onSearch;

    // ── Form ────────────────────────────────────────────────────────────────
    this.form = document.createElement('form');
    this.form.setAttribute('role', 'search');
    this.form.setAttribute('aria-label', 'Buscar ciudad');
    this.form.noValidate = true;

    // ── Label ───────────────────────────────────────────────────────────────
    const label = document.createElement('label');
    label.htmlFor = 'city-input';
    label.textContent = 'Nombre de ciudad';

    // ── Input (City_Input) ──────────────────────────────────────────────────
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.id = 'city-input';
    this.input.name = 'city';
    this.input.maxLength = 100;
    this.input.placeholder = 'Ej. Buenos Aires';
    this.input.autocomplete = 'off';
    this.input.setAttribute('aria-required', 'true');
    this.input.setAttribute('aria-describedby', 'city-input-error');

    // ── Validation message ──────────────────────────────────────────────────
    this.validationMessage = document.createElement('span');
    this.validationMessage.id = 'city-input-error';
    this.validationMessage.setAttribute('role', 'alert');
    this.validationMessage.setAttribute('aria-live', 'polite');
    this.validationMessage.hidden = true;

    // ── Submit button ───────────────────────────────────────────────────────
    this.button = document.createElement('button');
    this.button.type = 'submit';
    this.button.textContent = 'Buscar';

    // ── Assemble ────────────────────────────────────────────────────────────
    this.form.appendChild(label);
    this.form.appendChild(this.input);
    this.form.appendChild(this.validationMessage);
    this.form.appendChild(this.button);

    // ── Event listeners ─────────────────────────────────────────────────────
    this.form.addEventListener('submit', this.handleSubmit);
    // Req 1.2: trigger search when Enter is pressed while City_Input is focused
    this.input.addEventListener('keydown', this.handleKeydown);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Returns the root DOM element to be mounted by the caller. */
  getElement(): HTMLFormElement {
    return this.form;
  }

  /**
   * Re-enables the input and button after an error, keeping City_Input
   * accessible for the user to enter a new city name.
   * Requirement 1.6
   */
  enable(): void {
    this.input.disabled = false;
    this.button.disabled = false;
    this.input.focus();
  }

  /** Clears any validation message currently shown. */
  clearValidationMessage(): void {
    this.hideValidationMessage();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private readonly handleSubmit = (event: Event): void => {
    event.preventDefault();
    this.trySearch();
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    // Req 1.2: Enter key while City_Input is focused triggers the search
    if (event.key === 'Enter') {
      event.preventDefault();
      this.trySearch();
    }
  };

  private trySearch(): void {
    const raw = this.input.value;
    const trimmed = raw.trim();

    // Req 1.3 / 1.4: reject empty or whitespace-only input
    if (trimmed.length === 0) {
      this.showValidationMessage('El nombre de la ciudad es obligatorio.');
      this.input.focus();
      return;
    }

    this.hideValidationMessage();
    // Req 1.5: emit trimmed value to the controller
    this.onSearch(trimmed);
  }

  private showValidationMessage(message: string): void {
    this.validationMessage.textContent = message;
    this.validationMessage.hidden = false;
    this.input.setAttribute('aria-invalid', 'true');
  }

  private hideValidationMessage(): void {
    this.validationMessage.textContent = '';
    this.validationMessage.hidden = true;
    this.input.removeAttribute('aria-invalid');
  }
}

/** Reset scroll positions for tab/layout switches. */
export function resetAllScrollers(): void {
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

  const main = document.getElementById('studio-content-scroller');
  if (main) {
    main.scrollTop = 0;
  }

  document
    .querySelectorAll<HTMLElement>('[data-scroll-container]')
    .forEach((el) => {
      el.scrollTop = 0;
    });
}

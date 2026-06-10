export const SUBSCRIPTION_PLANS_SECTION_ID = 'subscription-plans';

/** Smooth-scroll the Studio main content scroller to a section by id. */
export function scrollToSection(
  sectionId: string,
  behavior: ScrollBehavior = 'smooth',
): boolean {
  const section = document.getElementById(sectionId);
  const scroller = document.getElementById('studio-content-scroller');
  if (!section || !scroller) {
    return false;
  }

  const top =
    section.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop;

  scroller.scrollTo({ top, behavior });
  return true;
}

export function scrollToSubscriptionPlans(
  behavior: ScrollBehavior = 'smooth',
): boolean {
  return scrollToSection(SUBSCRIPTION_PLANS_SECTION_ID, behavior);
}

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

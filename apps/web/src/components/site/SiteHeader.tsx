import { useT } from "@/i18n/useT";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { LocaleLink } from "@/i18n/LocaleLink";
import { isAppLocale } from "@/i18n/routing";
import { playgroundPath, studioAuthPath } from "@/lib/site";
import { cn } from "@/lib/utils";

import { CtaButton } from "./CtaButton";
import { ActocoreLogo } from "./ActocoreLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: '/#how-it-works', key: 'howItWorks' as const },
  { href: playgroundPath(), key: 'playground' as const },
  { href: '/#pricing', key: 'pricing' as const },
  { href: '/docs', key: 'docs' as const },
] as const;

const SCROLL_THRESHOLD_PX = 12;

type NavLinkKey = (typeof NAV_LINKS)[number]['key'];

function isNavLinkActive(
  key: NavLinkKey,
  pathname: string,
  hash: string,
  homePathname: string,
): boolean {
  const onHome =
    pathname === homePathname || pathname === `${homePathname}/`;

  switch (key) {
    case 'howItWorks':
      return onHome && hash === '#how-it-works';
    case 'pricing':
      return pathname.endsWith('/pricing') || (onHome && hash === '#pricing');
    case 'playground':
      return pathname.endsWith('/playground');
    case 'docs':
      return pathname.endsWith('/docs') || pathname.includes('/docs/');
    default:
      return false;
  }
}

function navLinkClassName(active: boolean, mobile = false) {
  return cn(
    'text-sm font-medium transition-colors',
    active
      ? mobile
        ? 'text-primary'
        : 'text-text-primary'
      : mobile
        ? 'text-text-primary hover:text-primary'
        : 'text-text-secondary hover:text-text-primary',
  );
}

function readScrolled(): boolean {
  return window.scrollY > SCROLL_THRESHOLD_PX;
}

export function SiteHeader() {
  const { t } = useT("nav");
  const { t: tSite } = useT("site");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useParams();
  const activeLocale = isAppLocale(locale) ? locale : "en";
  const homePathname = `/${activeLocale}`;

  useEffect(() => {
    const syncScrollState = () => {
      setScrolled(readScrolled());
    };

    syncScrollState();
    window.addEventListener("scroll", syncScrollState, { passive: true });
    return () => window.removeEventListener("scroll", syncScrollState);
  }, []);

  useEffect(() => {
    setScrolled(readScrolled());
  }, [location.pathname, location.hash]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const onHome =
      location.pathname === homePathname ||
      location.pathname === `${homePathname}/`;
    if (!onHome) return;

    event.preventDefault();

    if (location.hash) {
      navigate(homePathname, { replace: true });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const closeMobileMenu = () => setOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-border bg-surface-secondary shadow-sm"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="site-container flex h-20 items-center justify-between gap-4">
        <LocaleLink
          href="/"
          className="flex items-center gap-2.5 font-semibold text-text-primary"
          onClick={handleLogoClick}
        >
          <ActocoreLogo size={32} className="h-8 w-8" />
          <span>{tSite("name")}</span>
        </LocaleLink>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV_LINKS.map((item) => {
            const active = isNavLinkActive(
              item.key,
              location.pathname,
              location.hash,
              homePathname,
            );

            return (
              <LocaleLink
                key={item.href}
                href={item.href}
                className={navLinkClassName(active)}
                aria-current={
                  active
                    ? item.href.startsWith('/#')
                      ? 'location'
                      : 'page'
                    : undefined
                }
              >
                {t(item.key)}
              </LocaleLink>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <a
            href={studioAuthPath("login")}
            className="text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            {t("signIn")}
          </a>
          <CtaButton href={playgroundPath()} variant="outline">
            {t("tryItNow")}
          </CtaButton>
          <CtaButton href={studioAuthPath("signup")}>
            {t("getStarted")}
          </CtaButton>
        </div>

        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors md:hidden",
            scrolled
              ? "bg-surface text-text-primary"
              : "text-text-primary hover:bg-surface/60",
          )}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={t("menu")}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden",
          open ? "block" : "hidden",
          scrolled ? "bg-surface" : "bg-transparent",
        )}
      >
        <div className="site-container flex flex-col gap-4 py-4">
          {NAV_LINKS.map((item) => {
            const active = isNavLinkActive(
              item.key,
              location.pathname,
              location.hash,
              homePathname,
            );

            return (
              <LocaleLink
                key={item.href}
                href={item.href}
                className={navLinkClassName(active, true)}
                aria-current={
                  active
                    ? item.href.startsWith('/#')
                      ? 'location'
                      : 'page'
                    : undefined
                }
                onClick={closeMobileMenu}
              >
                {t(item.key)}
              </LocaleLink>
            );
          })}
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <a
            href={studioAuthPath("login")}
            className="text-sm font-medium text-text-secondary"
            onClick={closeMobileMenu}
          >
            {t("signIn")}
          </a>
          <CtaButton
            href={playgroundPath()}
            variant="outline"
            className="w-full text-center"
            onClick={closeMobileMenu}
          >
            {t("tryItNow")}
          </CtaButton>
          <CtaButton
            href={studioAuthPath("signup")}
            className="w-full text-center"
            onClick={closeMobileMenu}
          >
            {t("getStarted")}
          </CtaButton>
        </div>
      </div>
    </header>
  );
}

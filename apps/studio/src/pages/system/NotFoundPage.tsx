import NotFound from '@/components/ui/NotFound';

/** Full-page 404 route — wired via `defaultNotFoundComponent`. */
export default function NotFoundPage() {
  return <NotFound fullPage homeTo="/projects" />;
}

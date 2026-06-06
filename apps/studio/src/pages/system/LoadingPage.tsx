import LoadingScreen, {
  type LoadingScreenProps,
} from '@/components/ui/LoadingScreen';

/**
 * Route-level loading screen (boot, pending navigation, auth hydration).
 */
export default function LoadingPage(props: LoadingScreenProps) {
  return <LoadingScreen {...props} />;
}

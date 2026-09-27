import { StoreExperience } from '@/components/StoreExperience';
import { UnsupportedDeviceScreen } from '@/components/overlays/UnsupportedDeviceScreen';

const MOBILE_UA = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i;

function isTouchOnlyDevice() {
  const client = navigator as Navigator & { userAgentData?: { mobile?: boolean } };

  if (client.userAgentData?.mobile) return true;
  if (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return true;
  if (MOBILE_UA.test(navigator.userAgent)) return true;

  return navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches;
}

export default function App() {
  if (isTouchOnlyDevice()) return <UnsupportedDeviceScreen />;

  return <StoreExperience />;
}

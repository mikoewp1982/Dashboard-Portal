import { GuruPortalGate } from "@/components/guru/GuruPortalApp";
import { GuruSholatV2View } from "@/components/guru/GuruFeatureViews";

export default function GuruSholatDhuhaJumatPage() {
  return (
    <GuruPortalGate>
      <GuruSholatV2View />
    </GuruPortalGate>
  );
}

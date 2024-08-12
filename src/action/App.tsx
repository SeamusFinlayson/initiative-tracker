import { useEffect, useState } from "react";

import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { InitiativeHeader } from "../InitiativeHeader";
import { InitiativeTracker } from "./InitiativeTracker";
import {
  readBooleanFromMetadata,
  ZIPPER_INITIATIVE_ENABLED_METADATA_ID,
} from "../metadataHelpers";
import { ZipperInitiative } from "../zipperInitiative/ZipperInitiative";

export function App() {
  const [sceneReady, setSceneReady] = useState(false);
  const [zipperInitiativeEnabled, setZipperInitiativeEnabled] = useState(false);
  useEffect(() => {
    OBR.scene.isReady().then(setSceneReady);
    return OBR.scene.onReadyChange(setSceneReady);
  }, []);

  useEffect(() => {
    const handleRoomMetadataChange = (roomMetadata: Metadata) => {
      setZipperInitiativeEnabled(
        readBooleanFromMetadata(
          roomMetadata,
          ZIPPER_INITIATIVE_ENABLED_METADATA_ID,
          zipperInitiativeEnabled
        )
      );
    };
    OBR.room.getMetadata().then(handleRoomMetadataChange);
    return OBR.room.onMetadataChange(handleRoomMetadataChange);
  }, []);

  // Show a basic header when the scene isn't ready
  if (!sceneReady) {
    return (
      <InitiativeHeader subtitle="Open a scene to use the initiative tracker" />
    );
  }

  if (zipperInitiativeEnabled) return <ZipperInitiative />;

  return <InitiativeTracker />;
}

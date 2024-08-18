import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "../getPluginId";
import { PREVIOUS_STACK_METADATA_ID } from "../metadataHelpers";

export function writePreviousStackToScene(previousStack: string[]) {
  OBR.scene.setMetadata({
    [getPluginId(PREVIOUS_STACK_METADATA_ID)]: previousStack,
  });
}

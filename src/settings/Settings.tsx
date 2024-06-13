import {
  Box,
  Divider,
  Input,
  Switch,
  SxProps,
  Theme,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { getPluginId } from "../getPluginId";
import {
  ADVANCED_CONTROLS_METADATA_ID,
  DISPLAY_ROUND_METADATA_ID,
  ROUND_COUNT_METADATA_ID,
  SORT_ASCENDING_METADATA_ID,
  readBooleanFromMetadata,
} from "../metadataHelpers";
import { Height, StayPrimaryLandscape } from "@mui/icons-material";

export default function Settings(): JSX.Element {
  const [sortAscending, setSortAscending] = useState(false);
  const [displayRound, setDisplayRound] = useState(false);
  const [advancedControls, setAdvancedControls] = useState(false);

  useEffect(() => {
    const handleRoomMetadataChange = (roomMetadata: Metadata) => {
      setAdvancedControls(
        readBooleanFromMetadata(
          roomMetadata,
          ADVANCED_CONTROLS_METADATA_ID,
          advancedControls
        )
      );
      setDisplayRound(
        readBooleanFromMetadata(
          roomMetadata,
          DISPLAY_ROUND_METADATA_ID,
          displayRound
        )
      );
      setSortAscending(
        readBooleanFromMetadata(
          roomMetadata,
          SORT_ASCENDING_METADATA_ID,
          sortAscending
        )
      );
    };
    OBR.room.getMetadata().then(handleRoomMetadataChange);
    return OBR.room.onMetadataChange(handleRoomMetadataChange);
  }, []);

  const settingRowSx: SxProps<Theme> = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    // height: 30,
  };

  return (
    <Box sx={{ p: 2, pt: 0, pb: 0, color: "text.primary" }}>
      <Typography sx={{ fontSize: 26, pt: 3, pb: 0 }}>
        Pretty Sordid Settings
      </Typography>
      <Divider variant="fullWidth" sx={{ mt: 2, mb: 2 }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={settingRowSx}>
          <Typography>Sort order</Typography>
          <ToggleButtonGroup
            color="primary"
            value={sortAscending.toString()}
            exclusive
            onChange={(_e, value) => {
              const newSortAscending =
                value === null ? sortAscending : value === "true";
              setSortAscending(newSortAscending);
              OBR.room.setMetadata({
                [getPluginId(SORT_ASCENDING_METADATA_ID)]: newSortAscending,
              });
            }}
            aria-label="ascending or descending"
            sx={{
              height: 38,
            }}
          >
            <ToggleButton value="false">Descending</ToggleButton>
            <ToggleButton value="true">Ascending</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={settingRowSx}>
          <Typography>Use advanced controls</Typography>
          <Switch
            checked={advancedControls}
            onChange={(_e, value) =>
              OBR.room.setMetadata({
                [getPluginId(ADVANCED_CONTROLS_METADATA_ID)]: value,
              })
            }
          ></Switch>
        </Box>

        <Box
          sx={{
            pl: 2,
            color: advancedControls ? "" : "text.disabled",
            ...settingRowSx,
          }}
        >
          <Typography>Display current round</Typography>
          <Switch
            checked={displayRound}
            onChange={(_e, value) => {
              OBR.room.setMetadata({
                [getPluginId(DISPLAY_ROUND_METADATA_ID)]: value,
              });
              OBR.scene.setMetadata({
                [getPluginId(ROUND_COUNT_METADATA_ID)]: 1,
              });
            }}
            disabled={!advancedControls}
          ></Switch>
        </Box>
      </Box>
    </Box>
  );
}

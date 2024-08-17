import { Divider, MenuItem, Select, Switch, Typography } from "@mui/material";
import OBR, { Metadata, Player } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { getPluginId } from "../getPluginId";
import {
  ADVANCED_CONTROLS_METADATA_ID,
  DISABLE_NOTIFICATION_METADATA_ID,
  DISPLAY_ROUND_METADATA_ID,
  SELECT_ACTIVE_ITEM_METADATA_ID,
  SORT_ASCENDING_METADATA_ID,
  ZIPPER_INITIATIVE_ENABLED_METADATA_ID,
  readBooleanFromMetadata,
  readNumberFromMetadata,
} from "../metadataHelpers";

import "../tailwind.css";

export default function Settings(): JSX.Element {
  const [sortAscending, setSortAscending] = useState(false);
  const [advancedControls, setAdvancedControls] = useState(false);
  const [displayRound, setDisplayRound] = useState(false);
  const [disableNotifications, setDisableNotifications] = useState(false);
  const [zipperInitiativeEnabled, setZipperInitiativeEnabled] = useState(false);
  const [initializationDone, setInitializationDone] = useState(false);
  const [selectActiveItem, setSelectActiveItem] = useState(0);

  // const isDark = useTheme().palette.mode === "dark";
  const isDark =
    new URLSearchParams(document.location.search).get("mode") === "dark";

  useEffect(() => {
    const handleRoomMetadataChange = (roomMetadata: Metadata) => {
      setSortAscending(
        readBooleanFromMetadata(
          roomMetadata,
          SORT_ASCENDING_METADATA_ID,
          sortAscending,
        ),
      );
      setAdvancedControls(
        readBooleanFromMetadata(
          roomMetadata,
          ADVANCED_CONTROLS_METADATA_ID,
          advancedControls,
        ),
      );
      setDisplayRound(
        readBooleanFromMetadata(
          roomMetadata,
          DISPLAY_ROUND_METADATA_ID,
          displayRound,
        ),
      );
      setDisableNotifications(
        readBooleanFromMetadata(
          roomMetadata,
          DISABLE_NOTIFICATION_METADATA_ID,
          disableNotifications,
        ),
      );
      setZipperInitiativeEnabled(
        readBooleanFromMetadata(
          roomMetadata,
          ZIPPER_INITIATIVE_ENABLED_METADATA_ID,
          zipperInitiativeEnabled,
        ),
      );
      setSelectActiveItem(
        readNumberFromMetadata(
          roomMetadata,
          SELECT_ACTIVE_ITEM_METADATA_ID,
          selectActiveItem,
        ),
      );
      setInitializationDone(true);
    };
    OBR.room.getMetadata().then(handleRoomMetadataChange);
    return OBR.room.onMetadataChange(handleRoomMetadataChange);
  }, []);

  // Close settings popover if the users role changes to "PLAYER"
  useEffect(() => {
    return OBR.player.onChange((player: Player) => {
      if (player.role === "PLAYER") OBR.popover.close(getPluginId("settings"));
    });
  }, []);

  const settingCardClasses =
    "flex flex-nowrap items-center justify-between rounded-md bg-gray-50 p-2 outline outline-1 -outline-offset-1 outline-gray-300/60 dark:bg-gray-700/70 dark:outline-white/0";

  return (
    <div className={isDark ? "dark" : "text-black/[0.87]"}>
      <div className="absolute bottom-0 left-0 right-0 top-0 overflow-x-auto overflow-y-auto rounded-2xl bg-gray-50/90 outline -outline-offset-1 outline-fuchsia-400 dark:bg-gray-800/90 dark:outline-fuchsia-800">
        <div className="absolute -z-10 h-full w-full bg-fuchsia-400/40 dark:bg-fuchsia-700/100"></div>
        <div className="p-4 pt-0">
          <Typography sx={{ fontSize: 20, fontWeight: "bold", pt: 3, pb: 1 }}>
            Pretty Sordid Settings
          </Typography>
          <Divider></Divider>

          {initializationDone && (
            <>
              <div className="mb-1 mt-4">
                <Typography>General</Typography>
              </div>
              <div className="flex flex-col gap-1">
                <div className={settingCardClasses}>
                  <Typography>Select active item</Typography>
                  <Switch
                    color="secondary"
                    checked={selectActiveItem === 1 ? true : false}
                    onChange={(_e, checked) => {
                      const value = checked ? 1 : 0;
                      setSelectActiveItem(value);
                      OBR.room.setMetadata({
                        [getPluginId(SELECT_ACTIVE_ITEM_METADATA_ID)]: value,
                      });
                    }}
                  ></Switch>
                </div>

                <div className={settingCardClasses}>
                  <Typography>Initiative Style</Typography>
                  <Select
                    color="secondary"
                    value={zipperInitiativeEnabled.toString()}
                    onChange={(e) => {
                      const newZipperInitiativeEnabled =
                        e.target.value === "true";
                      setZipperInitiativeEnabled(newZipperInitiativeEnabled);
                      OBR.room.setMetadata({
                        [getPluginId(ZIPPER_INITIATIVE_ENABLED_METADATA_ID)]:
                          newZipperInitiativeEnabled,
                      });
                    }}
                    sx={{ height: 40, borderRadius: "6px" }}
                  >
                    <MenuItem value="false">Classic</MenuItem>
                    <MenuItem value="true">Alternating</MenuItem>
                  </Select>
                </div>
              </div>

              {!zipperInitiativeEnabled && (
                <>
                  <div className="mb-1 mt-4">
                    <Typography>Classic Initiative</Typography>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className={settingCardClasses}>
                      <Typography>Sort order</Typography>
                      <Select
                        color="secondary"
                        value={sortAscending.toString()}
                        onChange={(e) => {
                          const newSortAscending = e.target.value === "true";
                          setSortAscending(newSortAscending);
                          OBR.room.setMetadata({
                            [getPluginId(SORT_ASCENDING_METADATA_ID)]:
                              newSortAscending,
                          });
                        }}
                        aria-label="ascending or descending"
                        sx={{ height: 40, borderRadius: "6px" }}
                      >
                        <MenuItem value="false">Descending</MenuItem>
                        <MenuItem value="true">Ascending</MenuItem>
                      </Select>
                    </div>
                    <div className={settingCardClasses}>
                      <Typography>Use advanced controls</Typography>
                      <Switch
                        color="secondary"
                        checked={advancedControls}
                        onChange={(_e, value) => {
                          setAdvancedControls(value);
                          OBR.room.setMetadata({
                            [getPluginId(ADVANCED_CONTROLS_METADATA_ID)]: value,
                          });
                        }}
                      ></Switch>
                    </div>

                    <div className={settingCardClasses}>
                      <Typography>Display current round</Typography>
                      <Switch
                        color="secondary"
                        checked={displayRound}
                        onChange={(_e, value) => {
                          setDisplayRound(value);
                          OBR.room.setMetadata({
                            [getPluginId(DISPLAY_ROUND_METADATA_ID)]: value,
                          });
                        }}
                        disabled={!advancedControls}
                      ></Switch>
                    </div>
                    <div className={settingCardClasses}>
                      <Typography>Disable notifications</Typography>
                      <Switch
                        color="secondary"
                        checked={disableNotifications}
                        onChange={(_e, value) => {
                          setDisableNotifications(value);
                          OBR.room.setMetadata({
                            [getPluginId(DISABLE_NOTIFICATION_METADATA_ID)]:
                              value,
                          });
                        }}
                      ></Switch>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

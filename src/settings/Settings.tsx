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
import { cn } from "../utils";
import LinkButton from "./LinkButton";
import { Patreon } from "../assets/Patreon";
import { Bug } from "../assets/bug";
import { QuestionMark } from "../assets/QuestionMark";
import { History } from "../assets/History";
import { removeLabel } from "../findItem";

export default function Settings(): JSX.Element {
  // General settings
  const [selectActiveItem, setSelectActiveItem] = useState(0);
  const [zipperInitiativeEnabled, setZipperInitiativeEnabled] = useState(false);

  // Classic Initiative Settings
  const [sortAscending, setSortAscending] = useState(false);
  const [advancedControls, setAdvancedControls] = useState(false);
  const [displayRound, setDisplayRound] = useState(false);
  const [disableNotifications, setDisableNotifications] = useState(false);

  // UI state
  const [initializationDone, setInitializationDone] = useState(false);

  addThemeToBody();

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

  return (
    <div className="outline-secondary dark:outline-secondary-dark h-full w-full rounded-2xl bg-gray-200/20 py-2 pr-0.5 text-black/[0.87] outline -outline-offset-2 dark:bg-gray-800 dark:text-white">
      <div className="h-full overflow-y-scroll p-4 pr-1.5 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 pt-2">
          <div>
            <h1 className="text-2xl font-light">Settings</h1>
            <p className="text-xs text-gray-400">
              <i>Pretty Sordid Initiative Tracker</i>
            </p>
          </div>
          <div className="flex gap-2">
            <LinkButton
              name="Patreon"
              size="large"
              icon={<Patreon />}
              href={"https://www.patreon.com/SeamusFinlayson"}
            />
            <LinkButton
              name="Change Log"
              size="large"
              icon={<History />}
              href={"https://www.patreon.com/collection/596053"}
            />
            <LinkButton
              name="Instructions"
              size="large"
              icon={<QuestionMark />}
              href={
                "https://github.com/SeamusFinlayson/initiative-tracker?tab=readme-ov-file#pretty-sordid"
              }
            />
            <LinkButton
              name="Report Bug"
              size="large"
              icon={<Bug />}
              href="https://discord.gg/WMp9bky4be"
            />
          </div>
        </div>
        <Divider></Divider>

        {initializationDone && (
          <>
            <div className="mb-1 mt-4">
              <Typography>General</Typography>
            </div>
            <div className="flex flex-col gap-2">
              <SettingsRow
                label="Current Turn"
                description="Add an effect to highlight the active item"
                action={
                  <div className="flex min-w-24 justify-end">
                    <Select
                      color="secondary"
                      value={selectActiveItem.toString()}
                      onChange={(e) => {
                        const selectActiveItem = parseFloat(e.target.value);
                        setSelectActiveItem(selectActiveItem);
                        OBR.room.setMetadata({
                          [getPluginId(SELECT_ACTIVE_ITEM_METADATA_ID)]:
                            selectActiveItem,
                        });
                        if (selectActiveItem !== 2) removeLabel();
                      }}
                      sx={{ height: 40, borderRadius: "6px" }}
                    >
                      <MenuItem value="0">None</MenuItem>
                      <MenuItem value="1">Select</MenuItem>
                      <MenuItem value="2">Label</MenuItem>
                    </Select>
                  </div>
                }
              />

              <SettingsRow
                label="Initiative Style"
                description="Use counting (D&D style) initiative or checkbox (Draw Steel style) initiative"
                action={
                  <div className="flex min-w-28 justify-end">
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
                      <MenuItem value="false">Counting</MenuItem>
                      <MenuItem value="true">Checkbox</MenuItem>
                    </Select>
                  </div>
                }
              />
            </div>

            {!zipperInitiativeEnabled && (
              <>
                <div className="mb-1 mt-4">
                  <Typography>Classic Initiative</Typography>
                </div>
                <div className="flex flex-col gap-2">
                  <SettingsRow
                    label="Sorting"
                    description="Place higher initiatives at the start or end of the initiative"
                    action={
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
                    }
                  />

                  <SettingsRow
                    label="Advanced Controls"
                    description="Display back button and additional options"
                    action={
                      <Switch
                        color="secondary"
                        checked={advancedControls}
                        onChange={(_e, value) => {
                          setAdvancedControls(value);
                          OBR.room.setMetadata({
                            [getPluginId(ADVANCED_CONTROLS_METADATA_ID)]: value,
                          });
                        }}
                      />
                    }
                    last={advancedControls}
                  >
                    <SubSettingsRow
                      label="Round Counter"
                      description="Display the current Round"
                      action={
                        <Switch
                          color="secondary"
                          checked={displayRound}
                          onChange={(_e, value) => {
                            setDisplayRound(value);
                            OBR.room.setMetadata({
                              [getPluginId(DISPLAY_ROUND_METADATA_ID)]: value,
                            });
                          }}
                        />
                      }
                      collapseElement={!advancedControls}
                    />
                    <SubSettingsRow
                      label="Notifications"
                      description="Disable warning when the round count is reset"
                      action={
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
                        />
                      }
                      collapseElement={!advancedControls}
                      last
                    />
                  </SettingsRow>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  action,
  children,
  last,
}: {
  label: string;
  description: string;
  action: JSX.Element;
  children?: JSX.Element | JSX.Element[];
  last?: boolean;
}): JSX.Element {
  return (
    <div>
      <div
        className={cn(
          "flex min-h-16 items-center justify-start gap-4 rounded bg-gray-50 p-2 pl-3 dark:bg-gray-700/65",
          { "rounded-b-none": last },
        )}
      >
        <div>
          <label htmlFor="">{label}</label>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
        <div className="ml-auto">{action}</div>
      </div>
      {children}
    </div>
  );
}

function SubSettingsRow({
  label,
  description,
  action,
  last,
  collapseElement,
}: {
  label: string;
  description?: string;
  action: JSX.Element;
  last?: boolean;
  collapseElement: boolean;
}): JSX.Element {
  return (
    <div
      {...{ inert: collapseElement ? "" : undefined }} // type script react does not recognize inert
      className={cn("transition-max-height overflow-clip duration-300", {
        "max-h-60 ease-in": !collapseElement,
        "max-h-0 ease-out": collapseElement,
      })}
    >
      <div className="pt-0.5">
        <div
          className={cn(
            "flex items-center justify-start gap-4 rounded-none bg-gray-50 p-2 pl-6 dark:bg-gray-700/70",
            { "rounded-b": last },
          )}
        >
          <div>
            <label htmlFor="">{label}</label>
            <div className="text-xs text-gray-400">{description}</div>
          </div>
          <div className="ml-auto">{action}</div>
        </div>
      </div>
    </div>
  );
}

function addThemeToBody(themeMode?: "dark" | "light") {
  if (themeMode === undefined)
    themeMode = new URLSearchParams(document.location.search).get(
      "themeMode",
    ) as "dark" | "light";
  if (themeMode === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");
}

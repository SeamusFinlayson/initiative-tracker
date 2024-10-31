import { IconButton, useTheme } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "../getPluginId";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

export default function SettingsButton(): JSX.Element {
  const mode = useTheme().palette.mode;
  return (
    <IconButton
      onClick={() =>
        OBR.popover.open({
          id: getPluginId("settings"),
          url: `/src/settings/settings.html?themeMode=${mode}`,
          width: 400,
          height: 500,
          hidePaper: false,
        })
      }
    >
      <SettingsRoundedIcon></SettingsRoundedIcon>
    </IconButton>
  );
}

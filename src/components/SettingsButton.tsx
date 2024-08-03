import { IconButton } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "../getPluginId";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

export default function SettingsButton(): JSX.Element {
  return (
    <IconButton
      onClick={() =>
        OBR.popover.open({
          id: getPluginId("settings"),
          url: "/src/settings/settings.html",
          width: 400,
          height: 326,
        })
      }
    >
      <SettingsRoundedIcon></SettingsRoundedIcon>
    </IconButton>
  );
}

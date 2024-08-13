import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import CloseIcon from "@mui/icons-material/Close";

import VisibilityOffRounded from "@mui/icons-material/VisibilityOffRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import OutlinedFlagRoundedIcon from "@mui/icons-material/OutlinedFlagRounded";
import MoveDownRoundedIcon from "@mui/icons-material/MoveDownRounded";
import MoveUpRoundedIcon from "@mui/icons-material/MoveUpRounded";

import OBR from "@owlbear-rodeo/sdk";

import { InitiativeItem } from "../InitiativeItem";
import { Checkbox, IconButton } from "@mui/material";
import { Box } from "@mui/system";
import { getPluginId } from "../getPluginId";
import TokenImage from "../TokenImage";
import { focusItem } from "../findItem";

export function InitiativeListItem({
  item,
  onReadyChange,
  onGroupClick,
  showHidden: roleIsGm,
  edit,
}: {
  item: InitiativeItem;
  onReadyChange: (ready: boolean) => void;
  onGroupClick: (currentGroup: number) => void;
  showHidden: boolean;
  edit: boolean;
}) {
  if (!item.visible && !roleIsGm) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFocus = (event: any) => {
    event.target.select();
  };

  return (
    <ListItem
      key={item.id}
      secondaryAction={
        <>
          {edit ? (
            <IconButton
              className="buttonBox"
              onClick={() => onGroupClick(item.group)}
              onDoubleClick={e => e.stopPropagation()}
            >
              {item.group === 0 ? (
                <MoveDownRoundedIcon />
              ) : (
                <MoveUpRoundedIcon />
              )}
            </IconButton>
          ) : (
            <Checkbox
              checkedIcon={<FlagRoundedIcon></FlagRoundedIcon>}
              icon={<OutlinedFlagRoundedIcon></OutlinedFlagRoundedIcon>}
              checked={item.ready}
              onFocus={evt => {
                handleFocus(evt);
              }}
              value={item.count}
              onChange={e => onReadyChange(e.target.checked)}
              onDoubleClick={e => e.stopPropagation()}
              disabled={item.group === 1 && !roleIsGm}
            />
          )}
        </>
      }
      divider
      selected={item.active}
      sx={{
        padding: 1,
        pl: "12px",
        pr: "64px",
      }}
      onDoubleClick={() => focusItem(item.id)}
    >
      <Box
        component={"div"}
        className={!item.visible && roleIsGm ? "hiddenGrid" : "standardGrid"}
      >
        <IconButton
          sx={{ paddingX: 0, paddingY: 0, height: 30, width: 30 }}
          onClick={() => removeFromInitiative(item.id)}
          tabIndex={-1}
          onDoubleClick={e => e.stopPropagation()}
        >
          <div className="buttonBox">
            <TokenImage src={item.url}></TokenImage>
            <CloseIcon
              className="closeIcon"
              sx={{ height: 30, width: 30 }}
            ></CloseIcon>
          </div>
        </IconButton>

        {!item.visible && roleIsGm && (
          <ListItemIcon sx={{ minWidth: "20px", opacity: "0.5" }}>
            <VisibilityOffRounded fontSize="small" />
          </ListItemIcon>
        )}
        <Box
          component="div"
          sx={{
            color: !item.visible && roleIsGm ? "text.disabled" : "text.primary",
            pb: "2px",
          }}
        >
          {item.name}
        </Box>
      </Box>
    </ListItem>
  );
}

function removeFromInitiative(itemId: string) {
  OBR.scene.items.getItems([itemId]).then(items => {
    OBR.scene.items.updateItems(items, items => {
      for (const item of items) {
        delete item.metadata[getPluginId("metadata")];
      }
    });
  });
}

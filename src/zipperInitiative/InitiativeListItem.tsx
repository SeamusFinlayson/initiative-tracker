import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import CloseIcon from "@mui/icons-material/Close";

import VisibilityOffRounded from "@mui/icons-material/VisibilityOffRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import OutlinedFlagRoundedIcon from "@mui/icons-material/OutlinedFlagRounded";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import OBR from "@owlbear-rodeo/sdk";

import { InitiativeItem } from "../InitiativeItem";
import { Checkbox, IconButton } from "@mui/material";
import { Box } from "@mui/system";
import { getPluginId } from "../getPluginId";
import TokenImage from "../TokenImage";
import { focusItem } from "../findItem";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import "../tailwind.css";

export function InitiativeListItem({
  item,
  onReadyChange,
  showHidden: roleIsGm,
  edit,
  selected,
}: {
  item: InitiativeItem;
  onReadyChange: (ready: boolean) => void;
  showHidden: boolean;
  edit: boolean;
  selected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  if (!item.visible && !roleIsGm) {
    return null;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFocus = (event: any) => {
    event.target.select();
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={{ ...style, cursor: "pointer" }}
      {...attributes}
      key={item.id}
      secondaryAction={
        <>
          {edit ? (
            <button
              style={{ touchAction: "none" }}
              {...listeners}
              className="flex size-[42px] items-center justify-center bg-transparent"
            >
              <DragIndicatorIcon />
            </button>
          ) : (
            <Checkbox
              checkedIcon={<FlagRoundedIcon></FlagRoundedIcon>}
              icon={<OutlinedFlagRoundedIcon></OutlinedFlagRoundedIcon>}
              checked={item.ready}
              onFocus={(evt) => {
                handleFocus(evt);
              }}
              value={item.count}
              onChange={(e) => onReadyChange(e.target.checked)}
              onDoubleClick={(e) => e.stopPropagation()}
              disabled={
                (item.group === 1 && !roleIsGm) || (!item.active && !item.ready)
              }
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
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <div className="buttonBox">
            <TokenImage src={item.url} outline={selected} />
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
  OBR.scene.items.getItems([itemId]).then((items) => {
    OBR.scene.items.updateItems(items, (items) => {
      for (const item of items) {
        delete item.metadata[getPluginId("metadata")];
      }
    });
  });
}

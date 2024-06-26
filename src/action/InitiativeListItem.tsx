import ListItem from "@mui/material/ListItem";
import Input from "@mui/material/Input";
import ListItemIcon from "@mui/material/ListItemIcon";
import CloseIcon from "@mui/icons-material/Close";

import VisibilityOffRounded from "@mui/icons-material/VisibilityOffRounded";

import OBR, { Math2, Vector2 } from "@owlbear-rodeo/sdk";

import { InitiativeItem } from "./InitiativeItem";
import { IconButton } from "@mui/material";
import { Box, padding } from "@mui/system";
import { useState } from "react";
import { getPluginId } from "../getPluginId";
import TokenImage from "./TokenImage";

type InitiativeListItemProps = {
  item: InitiativeItem;
  onCountChange: (count: string) => void;
  showHidden: boolean;
  darkMode: boolean;
};

export function InitiativeListItem({
  item,
  onCountChange,
  showHidden,
  darkMode,
}: InitiativeListItemProps) {
  if (!item.visible && !showHidden) {
    return null;
  }

  async function focusItem() {
    // TODO: add cool down after item is deleted
    // Deselect the list item text
    window.getSelection()?.removeAllRanges();

    // Select this item
    await OBR.player.select([item.id]);

    // Focus on this item

    // Convert the center of the selected item to screen-space
    const bounds = await OBR.scene.items.getItemBounds([item.id]);
    const boundsAbsoluteCenter = await OBR.viewport.transformPoint(
      bounds.center
    );

    // Get the center of the viewport in screen-space
    const viewportWidth = await OBR.viewport.getWidth();
    const viewportHeight = await OBR.viewport.getHeight();
    const viewportCenter: Vector2 = {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    };

    // Offset the item center by the viewport center
    const absoluteCenter = Math2.subtract(boundsAbsoluteCenter, viewportCenter);

    // Convert the center to world-space
    const relativeCenter = await OBR.viewport.inverseTransformPoint(
      absoluteCenter
    );

    // Invert and scale the world-space position to match a viewport position offset
    const viewportScale = await OBR.viewport.getScale();
    const viewportPosition = Math2.multiply(relativeCenter, -viewportScale);

    await OBR.viewport.animateTo({
      scale: viewportScale,
      position: viewportPosition,
    });
  }

  const [inputHasFocus, setInputHasFocus] = useState(false);
  const [inputHasHover, setInputHasHover] = useState(false);
  const handleFocus = (event: any) => {
    event.target.select();
  };

  // const [buttonHasHover, setButtonHasHover] = useState(false);

  return (
    <ListItem
      key={item.id}
      secondaryAction={
        <Input
          disableUnderline
          sx={{ width: 48 }}
          onFocus={evt => {
            setInputHasFocus(true);
            handleFocus(evt);
          }}
          onBlur={() => setInputHasFocus(false)}
          onMouseEnter={() => setInputHasHover(true)}
          onMouseLeave={() => setInputHasHover(false)}
          inputProps={{
            sx: {
              textAlign: inputHasFocus ? "center" : "center",
              pt: "5px",
              // paddingX: 1,
              // width: "40px",
            },
            style: {
              borderRadius: 8,
              backgroundColor: inputHasFocus
                ? darkMode
                  ? "rgba(0,0,0,0.4)"
                  : "rgba(255,255,255,0.24)"
                : inputHasHover
                ? darkMode
                  ? "rgba(0,0,0,0.15)"
                  : "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0)",
              // backgroundColor: (inputHasFocus)?"rgba(0,0,0,0.2)":"rgba(0,0,0,0)",
              transition: ".1s",
            },
          }}
          value={item.count}
          onChange={e => {
            const newCount = e.target.value;
            onCountChange(newCount);
          }}
          onDoubleClick={e => e.stopPropagation()}
        />
      }
      divider
      selected={item.active}
      sx={{
        padding: 1,
        pl: "12px",
        pr: "64px",
      }}
      onDoubleClick={focusItem}
    >
      <Box
        component={"div"}
        className={!item.visible && showHidden ? "hiddenGrid" : "standardGrid"}
      >
        <IconButton
          sx={{ paddingX: 0, paddingY: 0, height: 30, width: 30 }}
          onClick={() => removeFromInitiative(item.id)}
          tabIndex={-1}
        >
          <div className="buttonBox">
            <TokenImage src={item.url}></TokenImage>
            <CloseIcon
              className="closeIcon"
              sx={{ height: 30, width: 30 }}
            ></CloseIcon>
          </div>
        </IconButton>

        {!item.visible && showHidden && (
          <ListItemIcon sx={{ minWidth: "20px", opacity: "0.5" }}>
            <VisibilityOffRounded fontSize="small" />
          </ListItemIcon>
        )}
        <Box
          component="div"
          sx={{
            color:
              !item.visible && showHidden ? "text.disabled" : "text.primary",
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
      for (let item of items) {
        delete item.metadata[getPluginId("metadata")];
      }
    });
  });
}

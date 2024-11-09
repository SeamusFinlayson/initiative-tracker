import ListItem from "@mui/material/ListItem";
import Input from "@mui/material/Input";
import ListItemIcon from "@mui/material/ListItemIcon";
import CloseIcon from "@mui/icons-material/Close";

import VisibilityOffRounded from "@mui/icons-material/VisibilityOffRounded";

import OBR from "@owlbear-rodeo/sdk";

import { InitiativeItem } from "../InitiativeItem";
import { IconButton } from "@mui/material";
import { Box } from "@mui/system";
import { useState } from "react";
import { getPluginId } from "../getPluginId";
import TokenImage from "../TokenImage";
import { focusItem } from "../findItem";

type InitiativeListItemProps = {
  item: InitiativeItem;
  onCountChange: (count: string) => void;
  showHidden: boolean;
  darkMode: boolean;
  selected: boolean;
};

export function InitiativeListItem({
  item,
  onCountChange,
  showHidden,
  darkMode,
  selected,
}: InitiativeListItemProps) {
  const [inputHasFocus, setInputHasFocus] = useState(false);
  const [inputHasHover, setInputHasHover] = useState(false);

  if (!item.visible && !showHidden) {
    return null;
  }

  const handleFocus = (target: HTMLInputElement) => {
    target.select();
  };

  // const [buttonHasHover, setButtonHasHover] = useState(false);

  return (
    <ListItem
      key={item.id}
      secondaryAction={
        <Input
          disableUnderline
          sx={{ width: 48 }}
          onFocus={(evt) => {
            setInputHasFocus(true);
            handleFocus(evt.target as HTMLInputElement);
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
          onChange={(e) => {
            const newCount = e.target.value;
            onCountChange(newCount);
          }}
          onDoubleClick={(e) => e.stopPropagation()}
        />
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
        className={!item.visible && showHidden ? "hiddenGrid" : "standardGrid"}
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
  OBR.scene.items.getItems([itemId]).then((items) => {
    OBR.scene.items.updateItems(items, (items) => {
      for (const item of items) {
        delete item.metadata[getPluginId("metadata")];
      }
    });
  });
}

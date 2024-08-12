import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import CloseIcon from "@mui/icons-material/Close";

import VisibilityOffRounded from "@mui/icons-material/VisibilityOffRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import OutlinedFlagRoundedIcon from "@mui/icons-material/OutlinedFlagRounded";

import OBR, { Math2, Vector2 } from "@owlbear-rodeo/sdk";

import { InitiativeItem } from "../InitiativeItem";
import { Checkbox, IconButton } from "@mui/material";
import { Box } from "@mui/system";
import { getPluginId } from "../getPluginId";
import TokenImage from "../TokenImage";

export function InitiativeListItem({
  item,
  onReadyChange,
  showHidden,
}: {
  item: InitiativeItem;
  onReadyChange: (ready: boolean) => void;
  showHidden: boolean;
}) {
  if (!item.visible && !showHidden) {
    return null;
  }

  async function focusItem() {
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

  const handleFocus = (event: any) => {
    event.target.select();
  };

  // const [buttonHasHover, setButtonHasHover] = useState(false);

  return (
    <ListItem
      key={item.id}
      secondaryAction={
        <>
          <Checkbox
            checkedIcon={<FlagRoundedIcon></FlagRoundedIcon>}
            icon={<OutlinedFlagRoundedIcon></OutlinedFlagRoundedIcon>}
            checked={item.ready}
            onFocus={evt => {
              handleFocus(evt);
            }}
            value={item.count}
            onChange={e => {
              const ready = e.target.checked;
              onReadyChange(ready);
            }}
            onDoubleClick={e => e.stopPropagation()}
          />
        </>
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
      for (const item of items) {
        delete item.metadata[getPluginId("metadata")];
      }
    });
  });
}

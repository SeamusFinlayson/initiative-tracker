import useImage from "./useImage";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";

export default function TokenImage({ src }: { src: string }) {
  const { loaded, error } = useImage({ src });

  if (loaded) {
    return (
      <img
        className="tokenIcon"
        src={src}
        width="30px"
        height="30px"
        onError={() => console.log("image failed to load")}
      ></img>
    );
  } else {
    return (
      <ImageRoundedIcon
        className="tokenIcon"
        color="disabled"
        width="30px"
        height="30px"
      ></ImageRoundedIcon>
    );
  }
}

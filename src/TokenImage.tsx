import { useEffect, useState } from "react";
import { createSvgIcon } from "@mui/material";

const ImageSvg = createSvgIcon(
  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.9 13.98l2.1 2.53 3.1-3.99c.2-.26.6-.26.8.01l3.51 4.68c.25.33.01.8-.4.8H6.02c-.42 0-.65-.48-.39-.81L8.12 14c.19-.26.57-.27.78-.02z" />,
  "Image"
);

export default function TokenImage({ src }: { src: string }) {
  const [imageAvailable, setImageAvailable] = useState(false);
  const [image, setImage] = useState(new Image());
  const [attempt, setAttempt] = useState(2); // try thrice, countdown from 2

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setImageAvailable(true);
    };
    image.onerror = () => {
      setImageAvailable(false);
      if (attempt > 0) setTimeout(updateAttempt, 5000);
    };
    image.src = src;
    setImage(image);
  }, [src, attempt]);

  const updateAttempt = () => {
    setAttempt(attempt - 1);
  };

  if (!imageAvailable) {
    return (
      <ImageSvg
        className="tokenIcon"
        color="action"
        width="30px"
        height="30px"
      />
    );
  }

  return (
    <img
      className="tokenIcon"
      src={image.src}
      width="30px"
      height="30px"
      onError={() => {
        setImageAvailable(false);
      }}
    ></img>
  );
}

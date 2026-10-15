import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { registerMemeImages } from "./game/memes.js";
import { MEME_PHOTOS } from "./game/memePhotos.js";

registerMemeImages(MEME_PHOTOS.map((p) => ({ ...p, src: `/memes/${p.file}` })));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

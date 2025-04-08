import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.0/+esm";
import { parseImage, recolorImageToHue, replaceTexture } from "./textureUtils.js";

document.getElementById("textureForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("packInput").files[0];
  const hue = document.getElementById("huePicker").value;
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const status = document.getElementById("status");
  const link = document.getElementById("downloadLink");

  status.textContent = "Processing...";

  const zip = await JSZip.loadAsync(file);
  const newZip = new JSZip();

  const texturePaths = [];

  zip.forEach((relativePath, file) => {
    if (relativePath.includes("textures/item") && relativePath.endsWith(".png")) {
      texturePaths.push(relativePath);
    } else {
      newZip.file(relativePath, file.async("arraybuffer")); // Copy unmodified files
    }
  });

  for (const path of texturePaths) {
    const imgData = await zip.file(path).async("uint8array");
    const modified = mode === "recolor"
      ? await recolorImageToHue(imgData, hue)
      : await replaceTexture(imgData, hue);

    newZip.file(path, modified);
  }

  const blob = await newZip.generateAsync({ type: "blob" });
  link.href = URL.createObjectURL(blob);
  link.style.display = "block";
  status.textContent = "Done!";
});

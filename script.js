let zipFile;
let textures = [];
let batchSize = 100; // Process 100 textures at a time
let currentBatch = 0;

document.getElementById('file-upload').addEventListener('change', handleFileUpload);
document.getElementById('process-button').addEventListener('click', processTextures);
document.getElementById('hue').addEventListener('input', updatePreview);
document.getElementById('saturation').addEventListener('input', updatePreview);
document.getElementById('brightness').addEventListener('input', updatePreview);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const zip = await JSZip.loadAsync(e.target.result);
            zipFile = zip;
            loadTextures(zip);
        };
        reader.readAsArrayBuffer(file);
    }
}

async function loadTextures(zip) {
    textures = []; // Clear the existing textures list
    zip.forEach((relativePath, file) => {
        if (file.name.match(/\.(png|jpg|jpeg)$/)) {
            file.async("base64").then((data) => {
                textures.push({
                    name: file.name,
                    data: data
                });
            });
        }
    });
}

function updatePreview() {
    const hue = parseInt(document.getElementById('hue').value);
    const saturation = parseInt(document.getElementById('saturation').value);
    const brightness = parseInt(document.getElementById('brightness').value);

    // Update the preview with the current adjustments (just for visual feedback)
    const previewContainer = document.getElementById('texture-preview');
    previewContainer.innerHTML = ''; // Clear existing preview
    textures.slice(0, batchSize).forEach((texture) => {
        const img = new Image();
        img.src = "data:image/png;base64," + texture.data;
        img.classList.add("texture-item");
        img.onload = function() {
            previewContainer.appendChild(img);
        };
    });
}

function processTextures() {
    if (currentBatch * batchSize >= textures.length) {
        alert("All textures have been processed.");
        return; // All textures are processed, stop
    }

    const hue = parseInt(document.getElementById('hue').value);
    const saturation = parseInt(document.getElementById('saturation').value);
    const brightness = parseInt(document.getElementById('brightness').value);

    // Process a batch of textures (100 textures at a time)
    for (let i = currentBatch * batchSize; i < Math.min((currentBatch + 1) * batchSize, textures.length); i++) {
        const texture = textures[i];
        const img = new Image();
        img.src = "data:image/png;base64," + texture.data;

        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Apply adjustments (Hue, Saturation, Brightness)
            for (let j = 0; j < data.length; j += 4) {
                let r = data[j];
                let g = data[j + 1];
                let b = data[j + 2];

                // Convert RGB to HSL
                let hsl = rgbToHsl(r, g, b);

                // Apply adjustments
                hsl[0] = (hsl[0] + hue / 360) % 1; // Hue adjustment
                hsl[1] = Math.min(1, Math.max(0, hsl[1] * (saturation / 100))); // Saturation adjustment
                hsl[2] = Math.min(1, Math.max(0, hsl[2] * (brightness / 100))); // Brightness adjustment

                // Convert HSL back to RGB
                let newRgb = hslToRgb(hsl[0], hsl[1], hsl[2]);

                // Set adjusted pixel data
                data[j] = newRgb[0];   // Red
                data[j + 1] = newRgb[1]; // Green
                data[j + 2] = newRgb[2]; // Blue
            }

            ctx.putImageData(imageData, 0, 0);

            const newImage = new Image();
            newImage.src = canvas.toDataURL();
            newImage.classList.add("texture-item");
            document.getElementById('texture-preview').appendChild(newImage);
        };
    }

    currentBatch++; // Move to the next batch
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
    }

    return [r * 255, g * 255, b * 255];
}

function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}

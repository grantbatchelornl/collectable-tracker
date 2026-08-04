export async function checkPhotoQuality(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const pixelCount = pixels.length / 4;

        let totalBrightness = 0;
        const brightnessValues = [];

        for (let i = 0; i < pixels.length; i += 4) {
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          brightnessValues.push(brightness);
          totalBrightness += brightness;
        }

        const avgBrightness = totalBrightness / pixelCount;

        let variance = 0;
        for (const b of brightnessValues) {
          variance += Math.pow(b - avgBrightness, 2);
        }
        const stdDev = Math.sqrt(variance / pixelCount);

        let laplacianSum = 0;
        let laplacianCount = 0;
        const w = canvas.width;
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            const c = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
            const idxU = ((y - 1) * w + x) * 4;
            const idxD = ((y + 1) * w + x) * 4;
            const idxL = (y * w + (x - 1)) * 4;
            const idxR = (y * w + (x + 1)) * 4;
            const u = (pixels[idxU] + pixels[idxU + 1] + pixels[idxU + 2]) / 3;
            const d = (pixels[idxD] + pixels[idxD + 1] + pixels[idxD + 2]) / 3;
            const l = (pixels[idxL] + pixels[idxL + 1] + pixels[idxL + 2]) / 3;
            const r = (pixels[idxR] + pixels[idxR + 1] + pixels[idxR + 2]) / 3;
            laplacianSum += Math.abs(-4 * c + u + d + l + r);
            laplacianCount++;
          }
        }
        const avgLaplacian = laplacianCount > 0 ? laplacianSum / laplacianCount : 0;

        const issues = [];
        if (avgBrightness < 50) issues.push({ type: 'darkness', message: 'Too dark' });
        if (avgBrightness > 235) issues.push({ type: 'glare', message: 'Overexposed' });
        if (stdDev < 15 && avgBrightness > 100) issues.push({ type: 'glare', message: 'Low contrast' });
        if (avgLaplacian < 8) issues.push({ type: 'blur', message: 'May be blurry' });

        resolve({ brightness: avgBrightness, contrast: stdDev, sharpness: avgLaplacian, issues });
      } catch (err) {
        resolve({ issues: [] });
      }
    };
    img.onerror = () => resolve({ issues: [] });
    img.src = imageUrl;
  });
}
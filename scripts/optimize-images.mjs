// Generates responsive WebP variants and records intrinsic sizes in work-data.json.
// Usage: npm run images
import sharp from 'sharp';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK_WIDTHS = [600, 1200, 2000];
const QUALITY = 80;

async function makeVariants(srcPath, outDir, widths) {
    await mkdir(outDir, { recursive: true });
    const base = path.basename(srcPath, path.extname(srcPath));
    // Apply EXIF rotation first so reported dimensions match what browsers show.
    const rotated = await sharp(srcPath).rotate().toBuffer({ resolveWithObject: true });
    const { width, height } = rotated.info;
    if (width < Math.max(...widths)) {
        console.warn(`${base}: source is only ${width}px wide; larger variants will not be upscaled`);
    }
    let total = 0;
    for (const w of widths) {
        const target = Math.min(w, width);
        const out = path.join(outDir, `${base}-${w}.webp`);
        await sharp(rotated.data).resize({ width: target, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(out);
        total += (await stat(out)).size;
    }
    console.log(`${base}: ${width}x${height} -> ${(total / 1024).toFixed(0)} KB across ${widths.length} sizes`);
    return { width, height };
}

const dataPath = path.join(root, 'work-data.json');
const items = JSON.parse(await readFile(dataPath, 'utf8'));

for (const item of items) {
    const dims = await makeVariants(
        path.join(root, 'images/work', item.filename),
        path.join(root, 'images/work/opt'),
        WORK_WIDTHS
    );
    item.width = dims.width;
    item.height = dims.height;
}
await writeFile(dataPath, JSON.stringify(items, null, 2) + '\n');

// About page image is only 1170px wide, so cap its variants there.
await makeVariants(
    path.join(root, 'images/about/clapple_painting.PNG'),
    path.join(root, 'images/about/opt'),
    [600, 1170]
);

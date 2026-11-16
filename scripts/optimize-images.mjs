// Generates responsive WebP variants and records intrinsic sizes in work-data.json.
// Usage: npm run images            (only converts new or changed originals)
//        npm run images -- --force (reconverts everything)
import sharp from 'sharp';
import { readFile, writeFile, mkdir, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK_WIDTHS = [600, 900, 1200, 2000];
const QUALITY = 80;
const force = process.argv.includes('--force');

async function mtime(file) {
    try {
        return (await stat(file)).mtimeMs;
    } catch {
        return 0;
    }
}

async function displayedSize(srcPath) {
    const { width, height, orientation } = await sharp(srcPath).metadata();
    // EXIF orientations 5-8 are rotated 90°, so browsers show them with width and height swapped.
    return orientation >= 5 ? { width: height, height: width } : { width, height };
}

async function makeVariants(srcPath, outDir, widths) {
    await mkdir(outDir, { recursive: true });
    const base = path.basename(srcPath, path.extname(srcPath));
    const outputs = widths.map(w => path.join(outDir, `${base}-${w}.webp`));
    const { width, height } = await displayedSize(srcPath);

    const srcTime = await mtime(srcPath);
    const upToDate = (await Promise.all(outputs.map(mtime))).every(t => t >= srcTime);
    if (upToDate && !force) {
        console.log(`${base}: up to date`);
        return { width, height };
    }

    if (width < Math.max(...widths)) {
        console.warn(`${base}: source is only ${width}px wide; larger variants will not be upscaled`);
    }
    let total = 0;
    for (const [i, w] of widths.entries()) {
        await sharp(srcPath)
            .rotate()
            .resize({ width: Math.min(w, width), withoutEnlargement: true })
            .webp({ quality: QUALITY })
            .toFile(outputs[i]);
        total += (await stat(outputs[i])).size;
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

const exhibitionsDir = path.join(root, 'images/exhibitions');
for (const file of (await readdir(exhibitionsDir)).filter(f => /\.(jpe?g|png)$/i.test(f))) {
    await makeVariants(path.join(exhibitionsDir, file), path.join(exhibitionsDir, 'opt'), WORK_WIDTHS);
}

// About page image is only 1170px wide, so cap its variants there.
await makeVariants(
    path.join(root, 'images/about/clapple_painting.PNG'),
    path.join(root, 'images/about/opt'),
    [600, 1170]
);

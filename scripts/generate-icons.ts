import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const SIZES = [16, 32, 48, 128] as const
const SVG_PATH = 'public/icon.svg'

const svg = readFileSync(SVG_PATH)

await Promise.all(
    SIZES.map(async size => {
        const out = `public/icon-${size}.png`
        await sharp(svg, { density: 512 })
            .resize(size, size)
            .png({ compressionLevel: 9 })
            .toFile(out)
        console.log(`✓ ${out}`)
    }),
)

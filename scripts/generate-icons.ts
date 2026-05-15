import { mkdirSync, readFileSync, copyFileSync } from 'node:fs'
import sharp from 'sharp'

const ICON_SIZES = [16, 32, 48, 128] as const

mkdirSync('store', { recursive: true })

const iconSvg = readFileSync('public/icon.svg')

await Promise.all(
    ICON_SIZES.map(async size => {
        const out = `public/icon-${size}.png`
        await sharp(iconSvg, { density: 512 })
            .resize(size, size)
            .png({ compressionLevel: 9 })
            .toFile(out)
        console.log(`✓ ${out}`)
    }),
)

copyFileSync('public/icon-128.png', 'store/icon-128.png')
console.log('✓ store/icon-128.png')

const promoSvg = readFileSync('store/screenshot-1280x800.svg')
await sharp(promoSvg, { density: 96 })
    .resize(1280, 800)
    .png({ compressionLevel: 9 })
    .toFile('store/screenshot-1280x800.png')
console.log('✓ store/screenshot-1280x800.png')

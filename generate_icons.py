"""Generate ThiagoEnglish PWA icons (192px + 512px PNG)."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "static")

def make_icon(size: int, filename: str) -> None:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Rounded square purple gradient background (approximated with solid violet)
    radius = int(size * 0.22)
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bg)
    bd.rounded_rectangle((0, 0, size, size), radius=radius, fill=(124, 58, 237, 255))
    img = Image.alpha_composite(img, bg)

    # Gradient overlay (top-left lighter)
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for i in range(size):
        a = int(60 * (1 - i / size))
        gd.line([(0, i), (size, i)], fill=(167, 139, 250, a))
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    img.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(img)

    # Letter "A" centered in white
    try:
        font_size = int(size * 0.55)
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except OSError:
        try:
            font = ImageFont.truetype("DejaVuSans-Bold.ttf", int(size * 0.55))
        except OSError:
            font = ImageFont.load_default()

    text = "T"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1] - int(size * 0.03)

    # Soft shadow
    d.text((tx + 2, ty + 4), text, font=font, fill=(91, 33, 182, 120))
    # Main letter
    d.text((tx, ty), text, font=font, fill=(255, 255, 255, 255))

    img.save(os.path.join(OUT_DIR, filename), "PNG", optimize=True)
    print(f"  wrote {filename}  ({size}x{size})")


def make_apple_icon(size: int, filename: str) -> None:
    """iOS apple-touch-icon: no transparency, no rounded corners (iOS adds them)."""
    img = Image.new("RGB", (size, size), (124, 58, 237))
    d = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("arialbd.ttf", int(size * 0.55))
    except OSError:
        try:
            font = ImageFont.truetype("DejaVuSans-Bold.ttf", int(size * 0.55))
        except OSError:
            font = ImageFont.load_default()

    text = "T"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1] - int(size * 0.03)

    d.text((tx + 2, ty + 4), text, font=font, fill=(91, 33, 182))
    d.text((tx, ty), text, font=font, fill=(255, 255, 255))

    img.save(os.path.join(OUT_DIR, filename), "PNG", optimize=True)
    print(f"  wrote {filename}  ({size}x{size})")


if __name__ == "__main__":
    print("Generating ThiagoEnglish icons...")
    make_icon(192, "icon-192.png")
    make_icon(512, "icon-512.png")
    make_apple_icon(180, "apple-touch-icon.png")
    print("Done.")

"""
Transformă o ramă de campanie (JPG/PNG cu interior de culoare uniformă) în
PNG 1080x1080 cu interiorul transparent, pentru product_poster.render_campaign_banner.

Utilizare: python make_campaign_frame.py rama.jpg frame.png
"""

import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SIZE = 1080
MARKER = (255, 0, 255)


def make_frame(src_path, out_path, thresh=18):
    frame = Image.open(src_path).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)
    # Interiorul = zona de culoare uniformă legată de centru
    probe = frame.copy()
    ImageDraw.floodfill(probe, (SIZE // 2, SIZE // 2), MARKER, thresh=thresh)
    diff = ImageChops.difference(probe, Image.new('RGB', (SIZE, SIZE), MARKER)).convert('L')
    mask = diff.point(lambda v: 255 if v == 0 else 0)
    mask = mask.filter(ImageFilter.MaxFilter(3))  # înghite haloul de lângă linia ramei
    if mask.getbbox() == (0, 0, SIZE, SIZE):
        raise SystemExit('Umplerea a ieșit din ramă: linia ramei nu e închisă sau thresh e prea mare')
    out = frame.convert('RGBA')
    out.putalpha(Image.eval(mask, lambda v: 255 - v))
    out.save(out_path, 'PNG')
    print(f'{out_path}: interior transparent {mask.getbbox()}')


if __name__ == '__main__':
    make_frame(sys.argv[1], sys.argv[2])

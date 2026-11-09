#!/usr/bin/env python3
"""Generate the Commonplace PWA icons with no third-party dependencies.

Draws at 3x and downsamples for smooth edges, then writes PNGs with zlib.
The mark is a neutral "C" monogram with a small period — a general journal,
not a pool blog. Usage: python3 tools/make-icons.py
"""
import math
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "icons")
SS = 3  # supersampling factor


def mix(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


class Canvas:
    def __init__(self, size):
        self.n = size * SS
        self.px = [[(0, 0, 0, 0) for _ in range(self.n)] for _ in range(self.n)]

    def set(self, x, y, color, alpha=1.0):
        x, y = int(x), int(y)
        if 0 <= x < self.n and 0 <= y < self.n:
            a = (color[3] / 255.0) * alpha
            if a <= 0:
                return
            old = self.px[y][x]
            oa = old[3] / 255.0
            na = a + oa * (1 - a)
            if na == 0:
                return
            clamp = lambda v: max(0, min(255, int(round(v))))
            out = tuple((a * color[i] + oa * (1 - a) * old[i]) / na for i in range(3))
            self.px[y][x] = (clamp(out[0]), clamp(out[1]), clamp(out[2]), clamp(na * 255))

    def rounded_rect(self, x0, y0, x1, y1, radius, fn):
        for y in range(int(y0), int(y1)):
            for x in range(int(x0), int(x1)):
                cx = min(max(x, x0 + radius), x1 - radius)
                cy = min(max(y, y0 + radius), y1 - radius)
                if math.hypot(x - cx, y - cy) <= radius:
                    self.set(x, y, fn(x, y))

    def circle(self, cx, cy, r, color, alpha=1.0):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                if math.hypot(x - cx, y - cy) <= r + 0.5:
                    self.set(x, y, color, alpha)

    def arc_ring(self, cx, cy, r_outer, r_inner, gap, color):
        """A thick ring with a wedge removed on the right (a 'C')."""
        for y in range(int(cy - r_outer - 1), int(cy + r_outer + 2)):
            for x in range(int(cx - r_outer - 1), int(cx + r_outer + 2)):
                d = math.hypot(x - cx, y - cy)
                if d < r_inner - 0.5 or d > r_outer + 0.5:
                    continue
                if abs(math.atan2(y - cy, x - cx)) < gap:
                    continue
                self.set(x, y, color)

    def downsample(self, size):
        out = []
        for y in range(size):
            row = []
            for x in range(size):
                acc = [0.0, 0.0, 0.0, 0.0]
                total = 0.0
                for dy in range(SS):
                    for dx in range(SS):
                        p = self.px[y * SS + dy][x * SS + dx]
                        w = p[3] / 255.0
                        for i in range(4):
                            acc[i] += p[i] * w
                        total += w
                if total:
                    rgba = tuple(max(0, min(255, int(round(acc[i] / total)))) for i in range(3)) + (
                        max(0, min(255, int(round(255 * total / (SS * SS))))),
                    )
                else:
                    rgba = (0, 0, 0, 0)
                row.append(rgba)
            out.append(row)
        return out


def draw(size, maskable=False):
    c = Canvas(size)
    n = c.n
    D = lambda v: v * n / 512.0
    pad = D(46 if maskable else 26)
    radius = D(112 if maskable else 96)

    # Oxide-red rounded square with a soft top-left lift.
    def bg(x, y):
        t = y / n
        base = mix((196, 72, 51), (142, 42, 32), t)
        g = math.exp(-(((x - n * 0.2) / (n * 0.5)) ** 2 + ((y - n * 0.05) / (n * 0.4)) ** 2))
        return (min(255, base[0] + int(26 * g)), min(255, base[1] + int(18 * g)), min(255, base[2] + int(12 * g)), 255)

    c.rounded_rect(pad, pad, n - pad, n - pad, radius, bg)

    cream = (251, 247, 239, 255)
    cx, cy = n * 0.5, n * 0.49
    scale = 0.86 if maskable else 1.0
    c.arc_ring(cx, cy, D(150) * scale, D(101) * scale, 0.72, cream)

    # A small "period" after the C — Commonplace.
    c.circle(n * 0.79, n * 0.79, D(17) * scale, cream)

    return c.downsample(size)


def png(path, pixels):
    size = len(pixels)
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b, a in row:
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)))
        f.write(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
        f.write(chunk(b"IEND", b""))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for size in (192, 512, 180):
        png(os.path.join(OUT, f"icon-{size}.png"), draw(size))
    png(os.path.join(OUT, "icon-maskable-512.png"), draw(512, maskable=True))
    png(os.path.join(OUT, "apple-touch-icon.png"), draw(180))
    for f in sorted(os.listdir(OUT)):
        print(f, os.path.getsize(os.path.join(OUT, f)), "bytes")

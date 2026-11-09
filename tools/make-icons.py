#!/usr/bin/env python3
"""Generate the Chalk & Cue PWA icons with no third-party dependencies.

Draws at 3x and downsamples for smooth edges, then writes PNGs with zlib.
Usage: python3 tools/make-icons.py
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
        if 0 <= x < self.n and 0 <= y < self.n:
            a = (color[3] / 255.0) * alpha
            if a <= 0:
                return
            old = self.px[y][x]
            # Source-over compositing with normalized alpha.
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
                # distance to the rounded box
                cx = min(max(x, x0 + radius), x1 - radius)
                cy = min(max(y, y0 + radius), y1 - radius)
                d = math.hypot(x - cx, y - cy)
                if d <= radius:
                    self.set(x, y, fn(x, y))

    def circle(self, cx, cy, r, fn, alpha=1.0):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                d = math.hypot(x - cx, y - cy)
                if d <= r + 0.5:
                    self.set(x, y, fn(x, y, d), alpha)

    def ring(self, cx, cy, r_outer, r_inner, color):
        self.circle(cx, cy, r_outer, lambda x, y, d: color if d >= r_inner else (0, 0, 0, 0))

    def downsample(self, size):
        out = []
        for y in range(size):
            row = []
            for x in range(size):
                acc = [0.0, 0.0, 0.0, 0.0]
                for dy in range(SS):
                    for dx in range(SS):
                        p = self.px[y * SS + dy][x * SS + dx]
                        for i in range(4):
                            acc[i] += p[i] * (p[3] / 255.0)
                total = 0.0
                for dy in range(SS):
                    for dx in range(SS):
                        total += self.px[y * SS + dy][x * SS + dx][3] / 255.0
                if total:
                    rgba = tuple(int(round(acc[i] / total)) for i in range(3)) + (
                        int(round(255 * total / (SS * SS))),
                    )
                else:
                    rgba = (0, 0, 0, 0)
                row.append(rgba)
            out.append(row)
        return out


def draw(size, maskable=False):
    c = Canvas(size)
    n = c.n
    s = n / 512.0  # design coordinate scale (design is 512x512)
    D = lambda v: v * s
    pad = D(46 if maskable else 26)
    radius = D(112 if maskable else 96)

    # Background: deep purple vertical gradient + two soft corner glows.
    def bg(x, y):
        t = y / n
        base = mix((27, 18, 66), (11, 8, 32), t)
        g1 = math.exp(-(((x - n * 0.12) / (n * 0.55)) ** 2 + ((y - n * 0.02) / (n * 0.42)) ** 2))
        g2 = math.exp(-(((x - n * 0.95) / (n * 0.48)) ** 2 + ((y - n * 0.12) / (n * 0.40)) ** 2))
        r = min(255, base[0] + int(70 * g1) + int(12 * g2))
        g = min(255, base[1] + int(12 * g1) + int(70 * g2))
        b = min(255, base[2] + int(60 * g1) + int(80 * g2))
        return (r, g, b, 255)

    c.rounded_rect(pad, pad, n - pad, n - pad, radius, bg)

    # A thin accent arc at the top: yellow -> pink -> cyan.
    for i in range(240):
        t = i / 239
        ang = math.pi * (1.12 + 0.76 * t)
        rr = D(196)
        x = n / 2 + rr * math.cos(ang)
        y = n * 0.53 + rr * math.sin(ang)
        col = mix((255, 183, 3), (255, 61, 129), min(1, t * 2)) if t < 0.5 else mix((255, 61, 129), (62, 230, 255), (t - 0.5) * 2)
        c.circle(x, y, D(4.5), lambda X, Y, d, col=col: (col[0], col[1], col[2], 255), alpha=0.9)

    # The eight ball.
    bx, by, br = n * 0.5, n * 0.55, D(148)

    def ball(x, y, d):
        # radial shading with a soft specular highlight in the upper left
        nx = (x - (bx - br * 0.35)) / (br * 1.6)
        ny = (y - (by - br * 0.45)) / (br * 1.6)
        light = max(0, 1 - math.hypot(nx, ny))
        edge = min(1, d / br)
        base = mix((20, 18, 38), (5, 5, 14), edge)
        glow = int(80 * light ** 2)
        return (min(255, base[0] + glow + 12), min(255, base[1] + glow + 8), min(255, base[2] + glow + 28), 255)

    c.circle(bx, by, br, ball)
    # rim light
    c.ring(bx, by, br, br - D(3), (90, 80, 150, 90))

    # White number patch.
    pr = D(60)
    c.circle(bx, by, pr, lambda x, y, d: (250, 249, 255, 255))
    # The "8": two black rings.
    eight = (14, 12, 28, 255)
    c.ring(bx, by - D(25), D(24), D(12), eight)
    c.ring(bx, by + D(25), D(28), D(14), eight)

    # Three small accent balls at the bottom (rack colours).
    balls = [((255, 183, 3), 0.30), ((255, 61, 129), 0.50), ((62, 230, 255), 0.70)]
    for col, fx in balls:
        x, y, r = n * fx, n * 0.865, D(21)

        def small(X, Y, d, col=col):
            light = max(0, 1 - math.hypot((X - (x - r * 0.3)) / (r * 1.4), (Y - (y - r * 0.3)) / (r * 1.4)))
            return (min(255, int(col[0] * 0.55) + int(110 * light)),
                    min(255, int(col[1] * 0.55) + int(110 * light)),
                    min(255, int(col[2] * 0.55) + int(110 * light)), 255)

        c.circle(x, y, r, small)

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

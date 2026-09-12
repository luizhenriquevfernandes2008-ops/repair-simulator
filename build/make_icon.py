# Gera icon.ico e icon.png (ícone do jogo) sem bibliotecas externas.
import struct, zlib, math, sys, os

out = sys.argv[1]
S = 4           # supersampling
N = 256
W = N * S

def rrect(x, y, x0, y0, x1, y1, r):
    cx = min(max(x, x0 + r), x1 - r); cy = min(max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r and x0 <= x <= x1 and y0 <= y <= y1

def heart(x, y, cx, cy, s):
    u = (x - cx) / s; v = -(y - cy) / s
    return (u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

big = [[(0, 0, 0, 0)] * W for _ in range(W)]
for j in range(W):
    y = j / S
    row = big[j]
    for i in range(W):
        x = i / S
        px = (0, 0, 0, 0)
        if rrect(x, y, 8, 8, 248, 248, 56):
            t = (x + y) / 512
            c = lerp((255, 170, 214), (240, 70, 150), t)
            px = c + (255,)
            # listras diagonais sutis
            if int((x - y) / 18) % 2 == 0: px = lerp(c, (255, 255, 255), .12) + (255,)
        # borda branca
        if rrect(x, y, 8, 8, 248, 248, 56) and not rrect(x, y, 18, 18, 238, 238, 48):
            px = (255, 255, 255, 255)
        # celular
        if rrect(x, y, 78, 34, 178, 222, 22): px = (74, 32, 64, 255)
        if rrect(x, y, 88, 52, 168, 196, 10): px = (255, 240, 248, 255)
        if rrect(x, y, 114, 206, 142, 213, 3): px = (255, 190, 225, 255)
        # coração na tela
        if heart(x, y, 128, 128, 30): px = (255, 77, 141, 255)
        # brilho do coração
        if (x - 116) ** 2 + (y - 116) ** 2 <= 36: px = (255, 220, 235, 255)
        # estrelinha amarela
        dx, dy = abs(x - 196), abs(y - 58)
        if dx * dy <= 30 and dx + dy <= 26: px = (255, 224, 102, 255)
        row[i] = px

def downsample(n):
    k = W // n
    img = []
    for j in range(n):
        r = []
        for i in range(n):
            acc = [0, 0, 0, 0]
            for yy in range(j * k, j * k + k):
                for xx in range(i * k, i * k + k):
                    p = big[yy][xx]
                    a = p[3]
                    acc[0] += p[0] * a; acc[1] += p[1] * a; acc[2] += p[2] * a; acc[3] += a
            a = acc[3]
            if a: r.append((acc[0] // a, acc[1] // a, acc[2] // a, a // (k * k)))
            else: r.append((0, 0, 0, 0))
        img.append(r)
    return img

def png(img):
    n = len(img)
    raw = b''.join(b'\x00' + bytes([c for p in row for c in p]) for row in img)
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')

sizes = [256, 64, 48, 32, 16]
pngs = [png(downsample(s)) for s in sizes]
open(os.path.join(out, 'icon.png'), 'wb').write(pngs[0])
hdr = struct.pack('<HHH', 0, 1, len(sizes))
off = 6 + 16 * len(sizes)
entries = b''; data = b''
for s, p in zip(sizes, pngs):
    entries += struct.pack('<BBBBHHII', s % 256, s % 256, 0, 0, 1, 32, len(p), off + len(data))
    data += p
open(os.path.join(out, 'icon.ico'), 'wb').write(hdr + entries + data)
print('ok', [len(p) for p in pngs])

"""Prepares the generated Android project: app icon, notification icon, splash screens,
notification sounds and the location permission (all generated or patched here, so no binary files are stored in the repo).
Usage: python tools/make_icons.py android/app/src/main/res
"""
import sys, os, glob, math
from PIL import Image, ImageDraw, ImageChops

RES = sys.argv[1] if len(sys.argv) > 1 else "android/app/src/main/res"
GREEN = (88, 204, 2, 255)
WHITE = (255, 255, 255, 255)


def crescent(size, color, scale=0.5, star=True):
    S = size * 4
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = S * scale / 2
    cx = cy = S / 2
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    off, rr = r * 0.42, r * 0.86
    cut = Image.new("L", (S, S), 0)
    ImageDraw.Draw(cut).ellipse(
        [cx + off - rr, cy - r * 0.10 - rr, cx + off + rr, cy - r * 0.10 + rr], fill=255)
    mask = ImageChops.subtract(mask, cut)
    im.paste(Image.new("RGBA", (S, S), color), (0, 0), mask)
    if star:
        sx, sy, sr = cx + r * 0.42, cy - r * 0.05, r * 0.17
        pts = []
        for i in range(10):
            a = -math.pi / 2 + i * math.pi / 5
            rad = sr if i % 2 == 0 else sr * 0.45
            pts.append((sx + rad * math.cos(a), sy + rad * math.sin(a)))
        d.polygon(pts, fill=color)
    return im.resize((size, size), Image.LANCZOS)


def p(*a):
    path = os.path.join(RES, *a)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


# adaptive icon foreground
for dens, sz in {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}.items():
    crescent(sz, WHITE, scale=0.46).save(p(f"mipmap-{dens}", "ic_launcher_foreground.png"))

# legacy square + round icons
for dens, sz in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
    S = sz * 4
    sq = Image.new("RGBA", (S, S), GREEN)
    fg = crescent(S, WHITE, scale=0.58)
    for name, shape in (("ic_launcher", "round_rect"), ("ic_launcher_round", "circle")):
        m = Image.new("L", (S, S), 0)
        md = ImageDraw.Draw(m)
        if shape == "circle":
            md.ellipse([0, 0, S - 1, S - 1], fill=255)
        else:
            md.rounded_rectangle([0, 0, S - 1, S - 1], radius=S * 0.22, fill=255)
        base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        base.paste(sq, (0, 0), m)
        base.alpha_composite(fg)
        base.resize((sz, sz), Image.LANCZOS).save(p(f"mipmap-{dens}", f"{name}.png"))

# notification small icon
for dens, sz in {"mdpi": 24, "hdpi": 36, "xhdpi": 48, "xxhdpi": 72, "xxxhdpi": 96}.items():
    crescent(sz, WHITE, scale=0.88).save(p(f"drawable-{dens}", "ic_stat_salah.png"))

# splash screens (keep the sizes of the template's files)
for f in glob.glob(os.path.join(RES, "drawable*", "splash.png")):
    w, h = Image.open(f).size
    im = Image.new("RGBA", (w, h), GREEN)
    c = crescent(min(w, h) // 3, WHITE, scale=0.9)
    im.alpha_composite(c, ((w - c.width) // 2, (h - c.height) // 2))
    im.convert("RGB").save(f)

# adaptive icon background colour
with open(p("values", "ic_launcher_background.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
            '    <color name="ic_launcher_background">#58CC02</color>\n</resources>\n')
print("icons generated in", RES)


# ---------------------------------------------------------------------------
# Notification sounds (synthesised here, so there are no copyright issues)
# ---------------------------------------------------------------------------
import wave, struct

RATE = 22050


def bell(freq, dur, amp, decay):
    n = int(RATE * dur)
    out = []
    partials = [(1.0, 1.0), (2.0, 0.45), (3.0, 0.22), (4.2, 0.10)]
    for i in range(n):
        t = i / RATE
        v = sum(a * math.sin(2 * math.pi * freq * m * t) for m, a in partials)
        env = math.exp(-decay * t) * min(1.0, t / 0.004)
        out.append(v * env * amp)
    return out


def mix(total, parts):
    buf = [0.0] * int(RATE * total)
    for start, samples in parts:
        off = int(RATE * start)
        for i, v in enumerate(samples):
            if off + i < len(buf):
                buf[off + i] += v
    peak = max(1e-9, max(abs(x) for x in buf))
    return [x / peak * 0.85 for x in buf]


def save_wav(name, samples):
    path = p("raw", name)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x)) * 32767)) for x in samples))


# soft "prayer time started" chime: gentle rising arpeggio
save_wav("prayer_start.wav", mix(2.4, [
    (0.00, bell(523.25, 1.6, 0.8, 3.2)),
    (0.35, bell(659.25, 1.6, 0.8, 3.2)),
    (0.70, bell(783.99, 1.7, 0.9, 2.8)),
]))

# attention-grabbing "ending soon" alert: two rising triple-strikes
group = [(0.0, 880.0), (0.30, 1108.7), (0.60, 1318.5)]
parts = []
for base in (0.0, 1.35):
    for off, f in group:
        parts.append((base + off, bell(f, 0.9, 1.0, 6.0)))
save_wav("urgent_reminder.wav", mix(2.9, parts))
print("sounds generated")

# ---------------------------------------------------------------------------
# Manifest: approximate-location permission (used only to find prayer times)
# ---------------------------------------------------------------------------
manifest = os.path.join(os.path.dirname(os.path.normpath(RES)), "AndroidManifest.xml")
if os.path.exists(manifest):
    txt = open(manifest, encoding="utf-8").read()
    perm = 'android.permission.ACCESS_COARSE_LOCATION'
    if perm not in txt:
        txt = txt.replace("</manifest>", '    <uses-permission android:name="%s" />\n</manifest>' % perm)
        open(manifest, "w", encoding="utf-8").write(txt)
    print("manifest patched")
else:
    print("WARNING: manifest not found at", manifest)

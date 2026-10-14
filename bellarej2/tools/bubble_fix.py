"""Soap-bubble icons are see-through, so they cannot be cut out cleanly from a grey background. For each bubble this
makes (1) the object alone (shield / tea glass), for the game to draw its own bubble around, and (2) a clean bubble:
the object, the bubble's own rim, and a smooth even tint inside. Usage: bubble_fix.py <sheet> <x0> <y0> <x1> <y1> <name> <outdir>"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
src, x0, y0, x1, y1, name, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6], sys.argv[7]
a = np.asarray(Image.open(src).convert('RGB')).astype(float)[y0:y1, x0:x1]
H, W, _ = a.shape
bg = np.median(np.concatenate([a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3)]), 0)
dist = np.sqrt(((a - bg) ** 2).sum(-1)); sat = a.max(-1) - a.min(-1); lum = a @ [0.299, 0.587, 0.114]
fg = dist > 18
ys, xs = np.where(fg); cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
R = ((ys.max() - ys.min()) + (xs.max() - xs.min())) / 4
yy, xx = np.mgrid[0:H, 0:W]; r = np.hypot(yy - cy, xx - cx)
inside = r < R - 26
obj = inside & ((sat > 45) | (lum < 125))
obj = ndimage.binary_closing(obj, iterations=3)
obj = ndimage.binary_fill_holes(obj)
lab, n = ndimage.label(obj); sz = ndimage.sum(obj, lab, range(1, n + 1))
# keep the object only: the biggest part plus big parts whose centre is well inside the bubble
# (the bubble's own rainbow swirls near the rim are saturated too, but they are thin and near the edge)
cm = ndimage.center_of_mass(obj, lab, range(1, n + 1))
big = int(np.argmax(sz)) + 1
keep = [i + 1 for i, (s_, (my, mx)) in enumerate(zip(sz, cm)) if i + 1 == big or (s_ > 600 and np.hypot(my - cy, mx - cx) < R * 0.55)]
obj = np.isin(lab, keep)
obj = ndimage.binary_opening(obj, iterations=2) | (np.isin(lab, [big]) & ndimage.binary_erosion(np.isin(lab, [big]), iterations=0))
# cut thin bubble swirls that touch the object: a strong opening removes them, then the object's own edge is restored
K = 6 if 'strong' in sys.argv[8:] else 2
core = ndimage.binary_opening(obj, iterations=K)
obj = obj & ndimage.binary_dilation(core, iterations=K)
if 'nopale' in sys.argv[8:]:   # object has no pale-blue parts of its own: drop the bubble's pale-blue swirls
    pale = (lum > 175) & (a[..., 2] - a[..., 0] > 8) & (sat < 90)
    obj = obj & ~pale
    lab2, n2 = ndimage.label(obj); s2 = ndimage.sum(obj, lab2, range(1, n2 + 1))
    obj = lab2 == (int(np.argmax(s2)) + 1)
    obj = ndimage.binary_fill_holes(obj)
obj = ndimage.binary_dilation(obj, iterations=1)
alpha = ndimage.gaussian_filter(obj.astype(float), 0.7)
o1 = np.dstack([a, alpha * 255]).round().astype('uint8'); im1 = Image.fromarray(o1, 'RGBA'); im1 = im1.crop(im1.getbbox())
im1.save(f'{out}/{name}-object.png')
# clean bubble: rim band from the original, even pale tint inside, object on top
rim = (r >= R - 16) & (r <= R + 2)
ra = np.clip((dist - 10) / 40, 0, 1) * rim
tint = np.array([235, 242, 255.]); ta = 0.22 * (r < R - 2)
A = np.clip(np.maximum(ra, ta), 0, 1); rgb = np.where(rim[..., None], a, tint)
rgb = rgb * (1 - alpha[..., None]) + a * alpha[..., None]; A = np.maximum(A, alpha)
edge = np.clip((R + 2 - r) / 2, 0, 1); A = A * edge
o2 = np.dstack([rgb, A * 255]).round().astype('uint8'); im2 = Image.fromarray(o2, 'RGBA'); im2 = im2.crop(im2.getbbox())
im2.save(f'{out}/{name}-bubble.png')
print(name, 'object', im1.size, 'bubble', im2.size)

"""Checks a generated sprite sheet: plain background, cropping, sizes; writes cut-outs with transparent backgrounds."""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
# 'solid': this sheet has pale parts almost the same grey as the background (pigeon underwings), so grey pockets
# fully enclosed by the drawing are kept as part of the figure instead of being cut out
OPTS = sys.argv[3:]
SOLID = 'solid' in OPTS
# 'close=N': how far apart two shapes may be and still count as one figure (default 6; objects packed close together need 3)
CLOSE = next((int(o.split('=')[1]) for o in OPTS if o.startswith('close=')), 6)
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(int); H, W, _ = a.shape
# background colour from a border strip
border = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
bg = np.median(border, axis=0)
dist = np.sqrt(((a - bg) ** 2).sum(-1))
bgmask = dist < 18
spread = np.percentile(np.sqrt(((border - bg) ** 2).sum(-1)), 99)
print(json.dumps({'size': [W, H], 'background_rgb': [int(x) for x in bg], 'background_noise_p99': round(float(spread), 1),
                  'background_share': round(float(bgmask.mean()), 3)}))
fg = ~bgmask
fg = ndimage.binary_opening(fg, iterations=1)
fg = ndimage.binary_closing(fg, iterations=CLOSE)      # join thin gaps inside one figure
lab, n = ndimage.label(fg)
objs = []
for i, sl in enumerate(ndimage.find_objects(lab), 1):
    ys, xs = sl; area = int((lab[sl] == i).sum())
    if area < 0.002 * W * H: continue
    objs.append({'id': i})
# a cluster much smaller than a neighbouring view and sitting inside its area (a burst of crystals or stars) is part of that view
info = {o['id']: (ndimage.find_objects((lab == o['id']).astype(int))[0], int((lab == o['id']).sum())) for o in objs}
for o in ([] if 'nomerge' in OPTS else list(objs)):   # 'nomerge': sheets of separate small items (building kits)
    (ys, xs), area = info[o['id']]
    cy, cx = (ys.start + ys.stop) / 2, (xs.start + xs.stop) / 2
    for p in objs:
        if p is o: continue
        (pys, pxs), parea = info[p['id']]
        if parea > 3 * area and pys.start - 60 <= cy <= pys.stop + 60 and pxs.start - 60 <= cx <= pxs.stop + 60:
            lab[lab == o['id']] = p['id']; objs.remove(o); break
# small separate pieces (flame embers, sparks, a loose tassel) belong to the nearest view if they are close to it
big_ids = [o['id'] for o in objs]
bigmask = np.isin(lab, big_ids)
dmap, (iy, ix) = ndimage.distance_transform_edt(~bigmask, return_indices=True)
for i, sl in enumerate(ndimage.find_objects(lab), 1):
    if i in big_ids or sl is None: continue
    comp = lab[sl] == i
    if comp.sum() < 25: continue
    d = np.where(comp, dmap[sl], np.inf); k = np.unravel_index(np.argmin(d), d.shape)
    if d[k] <= 50:
        y, x = k[0] + sl[0].start, k[1] + sl[1].start
        lab[sl][comp] = lab[iy[y, x], ix[y, x]]
# thin lines (whiskers, strings, a rope) are erased by the clean-up above: grow each view back along the raw
# drawing for a short distance, then attach small leftover bits (whisker tips) that sit right next to a view
raw = ~bgmask
for o in objs:
    m = lab == o['id']
    g = ndimage.binary_dilation(m, iterations=30, mask=raw | m)
    lab[g & (lab == 0)] = o['id']
rl, rn = ndimage.label(raw & (lab == 0))
if rn:
    owned = lab > 0
    dmap2, (iy2, ix2) = ndimage.distance_transform_edt(~owned, return_indices=True)
    for i, sl in enumerate(ndimage.find_objects(rl), 1):
        comp = rl[sl] == i
        if comp.sum() < 10: continue
        d = np.where(comp, dmap2[sl], np.inf); k = np.unravel_index(np.argmin(d), d.shape)
        if d[k] <= 40:
            y, x = k[0] + sl[0].start, k[1] + sl[1].start
            if lab[iy2[y, x], ix2[y, x]] in big_ids:
                lab[sl][comp] = lab[iy2[y, x], ix2[y, x]]
for o in objs:
    ys, xs = ndimage.find_objects((lab == o['id']).astype(int))[0]
    o.update({'x0': xs.start, 'y0': ys.start, 'x1': xs.stop, 'y1': ys.stop, 'w': xs.stop - xs.start, 'h': ys.stop - ys.start,
              'area': int((lab == o['id']).sum()), 'touches_edge': xs.start <= 2 or ys.start <= 2 or xs.stop >= W - 2 or ys.stop >= H - 2})
# reading order: rows then columns
objs.sort(key=lambda o: (o['y0'] + o['y1']) / 2)
rows, cur = [], []
for o in objs:   # a view starts a new row when its top is below the centre line of the current row
    if cur and o['y0'] > sum((p['y0'] + p['y1']) / 2 for p in cur) / len(cur):
        rows.append(cur); cur = []
    cur.append(o)
if cur: rows.append(cur)
objs = [o for r in rows for o in sorted(r, key=lambda o: o['x0'])]
# true background = background-coloured pixels reachable from the border, plus enclosed background pockets
# bigger than a speck (gaps between feathers that the closing step had filled in)
blab, _ = ndimage.label(bgmask)
edge_ids = np.unique(np.concatenate([blab[0], blab[-1], blab[:, 0], blab[:, -1]]))
outside = np.isin(blab, edge_ids[edge_ids > 0])
# do not let the background leak into a figure through 1-pixel gaps in its outline:
# rebuild "outside" from a version of the background with thin bridges removed, then grow it back 2 px
olab, _ = ndimage.label(ndimage.binary_opening(bgmask, iterations=2))
oedge = np.unique(np.concatenate([olab[0], olab[-1], olab[:, 0], olab[:, -1]]))
core = np.isin(olab, oedge[oedge > 0])
outside = ndimage.binary_dilation(core, iterations=3, mask=bgmask)
true_out = outside.copy()
sizes = ndimage.sum(bgmask, blab, index=np.arange(blab.max() + 1))
means = ndimage.mean(dist, blab, index=np.arange(blab.max() + 1))
# an enclosed pocket is real background only if it is as flat as the background (painted silver/grey parts are not)
outside |= (sizes[blab] > 40) & (means[blab] < (9.3 if SOLID else 10)) & bgmask   # 'solid' sheets: only very flat pockets are background
# small background-coloured specks close to the outside (notches between feather tips) are background too
if not SOLID:
    outside |= bgmask & (sizes[blab] >= 4) & (means[blab] < 9) & (ndimage.distance_transform_edt(~outside) <= 8)
lum = a @ np.array([0.299, 0.587, 0.114]); bg_lum = float(bg @ np.array([0.299, 0.587, 0.114]))
sat = a.max(-1) - a.min(-1)
# thick sharpening halo: pale grey pixels a little lighter than the background, reachable from the background
# without crossing an outline (silver horns and white feathers sit inside dark outlines, so they are not reached)
cand = (sat < 22) & (lum > bg_lum - 4) & (lum < bg_lum + 28) & ~bgmask
seed = true_out if SOLID else outside   # 'solid' sheets: halos only grow from the real outside, never from inner pockets
outside |= ndimage.binary_dilation(seed, iterations=4, mask=cand | seed) & cand
for k, o in enumerate(objs, 1):
    sl = (slice(o['y0'], o['y1']), slice(o['x0'], o['x1']))
    m = (lab[sl] == o['id'])
    if SOLID: m = ndimage.binary_fill_holes(m)   # keep pale parts fully enclosed by the figure
    m = m & ~outside[sl]
    d_out = ndimage.distance_transform_edt(m)          # px distance from the background
    rim = m & (d_out <= 2.0)
    core = m & ~rim
    rgb = a[sl].astype(float)
    # each rim pixel is a blend of the nearest solid bird colour F and the background:
    # alpha = how far it sits from the background along the line towards F
    _, (iy, ix) = ndimage.distance_transform_edt(~core, return_indices=True)
    F = rgb[iy, ix]
    v = F - bg; c = rgb - bg
    proj = (c * v).sum(-1) / np.maximum((v * v).sum(-1), 1.0)
    # when the figure's own colour there is almost the background grey (silver horns), the blend cannot be measured: keep it solid
    unsure = np.sqrt((v * v).sum(-1)) < 25
    # negative means the pixel is not a mix of F and the background (e.g. a dark outline next to a highlight brighter
    # than the background): judge it by how different it is from the background instead
    mix = np.where(proj < 0, np.clip((dist[sl] - 14) / 30, 0, 1), np.clip(proj, 0, 1))
    alpha = np.where(core, 1.0, np.where(rim, np.where(unsure, 1.0, mix), 0.0))
    # sharpening halo: pale, grey, lighter-than-background pixels on the rim are background, not bird
    near_true = ndimage.distance_transform_edt(~outside[sl]) <= 2.5
    alpha[rim & ~unsure & near_true & (lum[sl] > bg_lum - 4) & (sat[sl] < 22)] = 0
    alpha[alpha < 0.06] = 0
    # remove the background colour mixed into semi-transparent edge pixels
    part = (alpha > 0) & (alpha < 1)
    rgb[part] = np.clip((rgb[part] - (1 - alpha[part, None]) * bg) / alpha[part, None], 0, 255)
    rgba = np.dstack([rgb, alpha * 255]).round().astype('uint8')
    Image.fromarray(rgba, 'RGBA').save(f'{out}/view{k}.png')
    o['view'] = k
    print(json.dumps({k2: o[k2] for k2 in ('view', 'w', 'h', 'area', 'touches_edge', 'x0', 'y0')}))
# gaps between neighbours
if objs:
    hs = [o['h'] for o in objs]; ws = [o['w'] for o in objs]
    print(json.dumps({'views_found': len(objs), 'height_min_max': [min(hs), max(hs)], 'width_min_max': [min(ws), max(ws)]}))
# preview: cut-outs on a checkerboard
cells = [Image.open(f'{out}/view{k}.png') for k in range(1, len(objs) + 1)]
if cells:
    cw = max(c.width for c in cells) + 20; ch = max(c.height for c in cells) + 20; cols = 3; rows = (len(cells) + cols - 1) // cols
    sheet = Image.new('RGBA', (cw * cols, ch * rows), (255, 255, 255, 255))
    tile = Image.new('RGBA', (cw * cols, ch * rows))
    px = tile.load()
    for y in range(0, ch * rows, 16):
        for x in range(0, cw * cols, 16):
            col = (232, 228, 240, 255) if ((x // 16) + (y // 16)) % 2 else (205, 200, 214, 255)
            for yy in range(y, min(y + 16, ch * rows)):
                for xx in range(x, min(x + 16, cw * cols)): px[xx, yy] = col
    sheet = tile
    for k, c in enumerate(cells):
        sheet.alpha_composite(c, ((k % cols) * cw + (cw - c.width) // 2, (k // cols) * ch + (ch - c.height) // 2))
    sheet.convert('RGB').save(f'{out}/_preview.png')

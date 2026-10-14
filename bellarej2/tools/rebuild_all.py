"""Rebuilds every approved cut-out from its source sheet into deliver/all and zips it. One line per approved sheet."""
import subprocess, os, shutil, sys, json
import numpy as np
from scipy import ndimage
from kit_trim import trim_keep
from PIL import Image
U = '/root/.claude/uploads/d15f8b14-2059-5e52-a5f4-52fd76ad5b16/'
A = '/home/claude/assetcheck/'
B6 = ['back-wings-up', 'back-wings-down', 'top', 'side-right', 'front', 'back-glide']
P4 = ['landing-side-right', 'perched-side-right', 'perched-front', 'perched-back']
D = lambda six: ['back-wings-up', 'back-wings-down', 'top', 'side-right', 'front', six]
R7 = ['riding-back', 'riding-side-right', 'riding-front', 'standing-front', 'standing-back', 'face-happy', 'face-surprised']
# (folder, source sheet, file prefix, view names, views to mirror)
SHEETS = [
    ('birds/bellarej-stork', U + '31fa7fc3-image.png', 'bellarej', B6, ['back-glide']),
    ('birds/bellarej-stork', U + '8e40322a-image.png', 'bellarej', P4, []),
    ('birds/fez-sparrow', U + '760bd1b0-image.png', 'fez', B6, []),
    ('birds/fez-sparrow', U + 'c5b57481-image.png', 'fez', P4, []),
    ('birds/hudhud-hoopoe', U + '54a2b826-image.png', 'hudhud', B6, []),
    ('birds/hudhud-hoopoe', U + '2793c978-image.png', 'hudhud', P4, []),
    ('birds/saqr-falcon', A + 'saqr-fix/saqr-fixed.png', 'saqr', B6, []),
    ('birds/saqr-falcon', U + '2244f7d2-image.png', 'saqr', P4, []),
    ('birds/bouma-owl', U + '0ce4c10e-image.png', 'bouma', B6, []),
    ('birds/bouma-owl', U + '5ec561ff-image.png', 'bouma', P4, []),
    ('dragons/atlas', U + 'e7cc1559-image.png', 'atlas', D('ability-fire-side-right'), []),
    ('dragons/zarqa', U + '52eb7945-image.png', 'zarqa', D('ability-wave-side-right'), []),
    ('dragons/raml', U + 'a35e7240-image.png', 'raml', D('ability-dash-side-right'), []),
    ('dragons/zellige', U + 'b5b56779-image.png', 'zellige', D('ability-crystals-side-right'), []),
    ('dragons/najma', U + 'a9410c5f-image.png', 'najma', D('ability-stars-side-right'), []),
    ('riders/yassine', A + 'rider-yassine/yassine-fixed.png', 'yassine', R7, []),
    ('riders/yassine', U + 'a2b6d96c-image.png', 'yassine', ['stand-look-up', 'whistle-front', 'whistle-back', 'crouch-side-right', 'leap-side-right', 'leap-back'], []),
    ('riders/salma', U + '58af6982-image.png', 'salma', R7, []),
    ('riders/jeddi', U + '3e8dffcc-image.png', 'jeddi', R7, []),
    ('riders/mishmish', U + '3e744cdd-image.png', 'mishmish', ['perched-back', 'perched-side-right', 'perched-front', 'sitting-front', 'sitting-back', 'face-laughing', 'face-scared'], []),
    ('street/kids', U + '2437e887-image.png', 'kids', ['run-hoop-1', 'run-hoop-2', 'back', 'jump-clap'], []),
    ('street/tea-seller', U + '89311463-image.png', 'tea', ['pour-1', 'pour-2', 'back', 'raise-glass'], []),
    ('street/water-seller', U + '8fd7db49-image.png', 'guerrab', ['pour-1', 'pour-2', 'back', 'ring-bell'], []),
    ('street/spice-merchant', U + '324d6c59-image.png', 'spice', ['scoop-1', 'scoop-2', 'back', 'fist-laugh'], []),
    ('street/grandmother', U + '307a58ae-image.png', 'grandmother', ['wave-1', 'wave-2', 'back', 'toss-bread'], []),
    ('street/gnawa-musicians', U + '98350f2d-image.png', 'gnawa', ['dance-1', 'dance-2', 'back', 'cheer'], []),
    ('street/cats', A + 'cats-fix/cats-fixed.png', 'cat', ['ginger-sleeping', 'tuxedo-stretching', 'calico-sitting', 'grey-jumping-right', 'ginger-running-away'], []),
    ('street/pigeons', U + '2587b1cb-image.png', 'pigeon', ['standing-right', 'pecking', 'taking-off', 'flying-back-wings-up', 'flying-back-wings-down'], []),
    ('obstacles/easy', U + 'a7c20d16-image.png', 'easy', ['carpet-front', 'clothesline-front', 'pots-front', 'crate-front', 'stall-front', 'carpet-angle', 'clothesline-angle', 'pots-angle', 'crate-angle', 'stall-angle'], []),
    ('obstacles/medium', U + '192cf2e3-image.png', 'medium', ['lantern-front', 'donkey-cart-front', 'shutters-closed', 'spice-sacks-front', 'baskets-front', 'lantern-angle', 'donkey-cart-angle', 'shutters-open', 'spice-sacks-angle', 'baskets-angle'], []),
    ('obstacles/hard', U + '029d23f6-image.png', 'hard', ['arch-gate-front', 'scaffolding-front', 'chandelier-front', 'kites-front', 'cart-front', 'arch-gate-angle', 'scaffolding-collapsing', 'chandelier-angle', 'kites-angle', 'cart-angle'], []),
    ('places/marrakech-kit', U + '0a04593c-image.png', 'mk', ['wall-plain', 'wall-door', 'wall-windows', 'wall-balcony', 'tower', 'roof-strip', 'shop-front', 'pot-large', 'lantern', 'carpet', 'pot-small'], []),
    ('places/fes-kit', U + '4cdf08c9-image.png', 'fes', ['wall-plain', 'wall-door', 'wall-windows', 'wall-balcony', 'tower', 'roof-strip', 'shop-front', 'lantern', 'carpet', 'plant-pot', 'flower-pot'], []),
    ('places/chefchaouen-kit', U + 'f24703aa-image.png', 'chef', ['wall-plain', 'wall-door', 'wall-windows', 'wall-balcony', 'tower', 'roof-strip', 'shop-front', 'flower-pot-large', 'lantern', 'carpet', 'flower-pot-small'], []),
    ('places/desert-kit', U + '14ead45b-image.png', 'desert', ['wall-plain', 'wall-door', 'wall-windows', 'wall-balcony', 'tower', 'roof-strip', 'shop-front', 'flower-pot', 'lantern', 'carpet', 'plant-pot'], []),
    ('places/coast-kit', U + '6d49477f-image.png', 'coast', ['wall-nets', 'wall-door', 'wall-windows', 'wall-balcony', 'tower', 'rampart-strip', 'fish-shop', 'boat', 'lantern', 'plant-pot-large', 'plant-pot-small', 'hanging-net', 'carpet'], []),
    ('places/night-kit', U + 'b3ec0ed2-image.png', 'night', ['wall-plain', 'wall-door', 'wall-windows', 'wall-balcony', 'tower', 'roof-strip', 'shop-front', 'pot-large', 'lantern', 'carpet', 'pot-small'], []),
    ('icons', U + 'b54dde88-image.png', 'icon', ['coin-front', 'coin-turned', 'coin-edge', 'coin-pile', 'SKIP-shield', 'SKIP-tea', 'crown', 'pause', 'ability-fire', 'ability-wave', 'ability-sand', 'ability-crystal', 'ability-starlight', 'meter-empty', 'meter-half', 'meter-full'], []),
    ('street/washerwoman', U + '92171e74-image.png', 'washerwoman', ['hang-sheet-1', 'hang-sheet-2', 'back', 'wave', 'basket'], []),
]
SPLIT = {U + '6d49477f-image.png': [10]}
TRIM = {U + 'b3ec0ed2-image.png': {1, 2, 3, 4, 5, 6, 7}, U + '6d49477f-image.png': {1, 2, 3, 4, 5, 6, 7}, U + '14ead45b-image.png': {1, 2, 3, 4, 5, 6, 7}, U + 'f24703aa-image.png': {1, 2, 3, 4, 5, 6, 7}, U + '0a04593c-image.png': {1, 2, 3, 4, 5, 6, 7}, U + '4cdf08c9-image.png': {1, 2, 3, 4, 5, 6, 7}}   # kit pieces that join side by side
OPTS = {U + 'b54dde88-image.png': ['close=3', 'nomerge'], U + 'b3ec0ed2-image.png': ['close=2', 'nomerge'], U + '6d49477f-image.png': ['close=2', 'nomerge'], U + '14ead45b-image.png': ['close=2', 'nomerge'], U + 'f24703aa-image.png': ['close=2', 'nomerge'], U + '4cdf08c9-image.png': ['close=3', 'nomerge'], U + '0a04593c-image.png': ['close=3', 'nomerge'], U + '029d23f6-image.png': ['close=3'], U + 'a7c20d16-image.png': ['close=3'], U + '192cf2e3-image.png': ['close=3']}
SOLID = {U + '2587b1cb-image.png'}
GROUPS = {U + '2437e887-image.png': [[1], [2], [3, 4], [5, 6]]}
OUT = A + 'deliver/all'; TMP = '/tmp/claude-0/-home-claude-bellarej/d15f8b14-2059-5e52-a5f4-52fd76ad5b16/scratchpad/rebuild'
shutil.rmtree(OUT, ignore_errors=True); shutil.rmtree(TMP, ignore_errors=True)
total = 0
joins = {}
for k, (folder, src, pre, names, mirror) in enumerate(SHEETS):
    t = f'{TMP}/{k}'
    res = subprocess.run(['python3', A + 'check.py', src, t] + (['solid'] if src in SOLID else []) + OPTS.get(src, []), capture_output=True, text=True)
    views = [json.loads(l) for l in res.stdout.splitlines() if l.startswith('{"view"')]
    for k, v in enumerate(views, 1): v['file'] = f'{t}/view{k}.png'
    # SPLIT: a view that is really two objects touching (leaves of two pot plants): split it into its two largest
    # parts, giving every pixel to the nearer part, and insert the second part as an extra view right after it
    for vi in sorted(SPLIT.get(src, []), reverse=True):
        v = views[vi - 1]; im = Image.open(f'{t}/view{vi}.png'); a = np.asarray(im)
        solid = ndimage.binary_opening(a[..., 3] > 128, iterations=2)
        lab, n = ndimage.label(solid); sizes = ndimage.sum(solid, lab, range(1, n + 1))
        top2 = (np.argsort(sizes)[-2:] + 1)
        seeds = np.isin(lab, top2) * lab
        _, (iy, ix) = ndimage.distance_transform_edt(seeds == 0, return_indices=True)
        owner = seeds[iy, ix]
        parts = []
        for k in top2:
            b = a.copy(); b[..., 3] = np.where(owner == k, a[..., 3], 0)
            p = Image.fromarray(b, 'RGBA'); bb = p.getbbox()
            parts.append((bb[0], p.crop(bb), bb))
        parts.sort(key=lambda q: q[0])
        for j, (_, p, bb) in enumerate(parts):
            p.save(f'{t}/split{vi}_{j}.png')
        views[vi - 1:vi] = [dict(v, x0=v['x0'] + bb[0], y0=v['y0'] + bb[1], w=p.width, h=p.height, file=f'{t}/split{vi}_{j}.png') for j, (_, p, bb) in enumerate(parts)]
    groups = GROUPS.get(src, [[i] for i in range(1, len(views) + 1)])
    if len(views) != sum(len(g) for g in groups) or len(groups) != len(names):
        sys.exit(f'STOP: {src} gave {len(views)} views, expected {len(names)}')
    os.makedirs(f'{OUT}/{folder}', exist_ok=True)
    for (i, n), g in zip(enumerate(names, 1), groups):
        vs = [views[j - 1] for j in g]
        x0 = min(v['x0'] for v in vs); y0 = min(v['y0'] for v in vs)
        x1 = max(v['x0'] + v['w'] for v in vs); y1 = max(v['y0'] + v['h'] for v in vs)
        im = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
        for j, v in zip(g, vs):   # characters drawn together (two kids, two musicians) stay one picture
            im.alpha_composite(Image.open(v.get('file', f'{t}/view{j}.png')), (v['x0'] - x0, v['y0'] - y0))
        im = im.crop(im.getbbox())
        if i in TRIM.get(src, ()):
            im, an = trim_keep(im)
            joins.setdefault(folder, {})[f'{pre}-{n}.png'] = an
        if n in mirror: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        if n.startswith('SKIP'): continue   # see-through bubbles: replaced below by bubble_fix.py
        im.save(f'{OUT}/{folder}/{pre}-{n}.png'); total += 1
# far backgrounds: not cut out, only made seamless left-to-right
BACKGROUNDS = [('places/marrakech-bg', U + 'e4027ed5-image.png', 'marrakech-far-background.png'),
               ('places/fes-bg', U + '3a36f191-image.png', 'fes-far-background.png'),
               ('places/chefchaouen-bg', U + '2dbeaf41-image.png', 'chefchaouen-far-background.png'),
               ('places/desert-bg', U + 'f9d627b7-image.png', 'desert-far-background.png'),
               ('places/coast-bg', U + 'f8beac00-image.png', 'coast-far-background.png'),
               ('places/night-bg', U + 'ed7fd20e-image.png', 'night-far-background.png')]
for folder, src, name in BACKGROUNDS:
    os.makedirs(f'{OUT}/{folder}', exist_ok=True)
    subprocess.run(['python3', A + 'bg_seamless.py', src, f'{OUT}/{folder}/{name}', '200'], check=True, capture_output=True)
    total += 1
for nm, box, extra in [('shield', (25, 320, 307, 601), ['strong', 'nopale']), ('tea', (332, 320, 614, 601), [])]:
    subprocess.run(['python3', A + 'bubble_fix.py', U + 'b54dde88-image.png', *map(str, box), nm, TMP] + extra, check=True, capture_output=True)
    shutil.copy(f'{TMP}/{nm}-bubble.png', f'{OUT}/icons/icon-powerup-{nm}-bubble.png'); total += 1
for folder, d in joins.items():   # where each kit piece joins its neighbours (see kit_trim.trim_keep)
    json.dump(d, open(f'{OUT}/{folder}/joins.json', 'w'), indent=1)
z = A + 'deliver/bellarej2-cutouts-all.zip'
if os.path.exists(z): os.remove(z)
subprocess.run(['zip', '-qr', z, '.'], cwd=OUT, check=True)
# one zip per group too, because a single file over 30 MB cannot be sent in the chat
for g in sorted(os.listdir(OUT)):
    zg = A + f'deliver/bellarej2-{g}.zip'
    if os.path.exists(zg): os.remove(zg)
    subprocess.run(['zip', '-qr', zg, g], cwd=OUT, check=True)
print('cut-outs:', total)

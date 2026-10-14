"""Makes a wide background repeat without a visible seam, without ghosting.
The last N columns overlap the first N. Inside that overlap a winding top-to-bottom cut line is found where the two
pictures differ least (like a tailor's seam); left of the line comes from the picture's right end, right of it from
its left start, with a 3-pixel soft edge. The overlap columns are then removed from the end.
Usage: bg_seamless.py <in> <out> [N]"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
src, out = sys.argv[1], sys.argv[2]; N = int(sys.argv[3]) if len(sys.argv) > 3 else 160
a = np.asarray(Image.open(src).convert('RGB')).astype(float); H, W, _ = a.shape
A = a[:, W - N:]          # end of the picture (comes first in the joined strip)
B = a[:, :N]              # start of the picture
cost = np.abs(A - B).sum(-1)
cost = ndimage.gaussian_filter(cost, 1.0)
# dynamic programming: cheapest connected path from top to bottom, moving at most 1 column per row
acc = cost.copy(); back = np.zeros((H, N), int)
for y in range(1, H):
    prev = acc[y - 1]
    l = np.r_[np.inf, prev[:-1]]; r = np.r_[prev[1:], np.inf]
    st = np.stack([l, prev, r]); i = st.argmin(0)
    acc[y] += st[i, np.arange(N)]; back[y] = np.arange(N) + i - 1
path = np.zeros(H, int); path[-1] = acc[-1].argmin()
for y in range(H - 1, 0, -1): path[y - 1] = back[y, path[y]]
xs = np.arange(N)[None, :]
w = np.clip((xs - path[:, None] + 1.5) / 3.0, 0, 1)[..., None]   # 0 = take A (end), 1 = take B (start)
head = A * (1 - w) + B * w
res = np.concatenate([head, a[:, N:W - N]], axis=1)
Image.fromarray(res.round().astype('uint8')).save(out)
d = np.abs(res[:, -1] - res[:, 0]).mean(-1); n = np.abs(res[:, 1] - res[:, 0]).mean(-1)
print('seam cost per row', round(cost[np.arange(H), path].mean(), 1), '| size', res.shape[1], H, '| edge mismatch', round(d.mean(), 1), 'vs normal', round(n.mean(), 1))

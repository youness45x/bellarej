"""Building-kit pieces are drawn as framed panels with a dark outline on the left and right edges.
Pieces that must sit side by side are trimmed past that outline, and their new edge columns made fully opaque,
so neighbouring pieces join without a dark line or a gap."""
import numpy as np
from PIL import Image

def trim_sides(im, lo=0.30, hi=0.92):
    a = np.asarray(im).astype(float); A = a[..., 3] / 255; H, W = A.shape
    lum = a[..., :3] @ [0.299, 0.587, 0.114]
    r0, r1 = int(H * lo), int(H * hi)
    def bad(x):   # outline / gap column: not solid, or mostly dark outline
        col_a = A[r0:r1, x]; col_l = lum[r0:r1, x]
        return col_a.mean() < 0.97 or (col_l < 80).mean() > 0.35
    L = 0
    while L < W // 6 and bad(L): L += 1
    R = W - 1
    while R > W - W // 6 and bad(R): R -= 1
    L += 1; R -= 1   # one extra pixel for the anti-aliased edge
    out = a[:, L:R + 1].copy()
    # make the new side columns opaque wherever the column just inside is opaque
    for x, nx in ((0, 1), (-1, -2)):
        m = out[:, nx, 3] > 200
        out[m, x, 3] = 255
    return Image.fromarray(out.round().astype('uint8'), 'RGBA'), (L, W - 1 - R)

def trim_keep(im, lo=0.30, hi=0.92, outline=7):
    """Like trim_sides, but decorations that stick out past the wall edge (plants, flowers, a lower roof) are kept.
    Returns the picture and the wall join edges {left, right} in pixels from the picture's left edge:
    the game places the next piece so its left join meets this piece's right join, and decorations overlap."""
    a = np.asarray(im).astype(float); A = a[..., 3] / 255; H, W = A.shape
    lum = a[..., :3] @ [0.299, 0.587, 0.114]
    r0, r1 = int(H * lo), int(H * hi)
    def bad(x):
        return A[r0:r1, x].mean() < 0.97 or (lum[r0:r1, x] < 80).mean() > 0.35
    L = 0
    while L < W // 4 and bad(L): L += 1
    R = W - 1
    while R > W - W // 4 and bad(R): R -= 1
    L += 1; R -= 1
    out = a.copy()
    # erase the outline band just outside each join edge, in rows where nothing sticks out beyond it
    for x0, x1, probe in ((max(L - outline, 0), L, max(L - outline - 2, 0)), (R + 1, min(R + 1 + outline, W), min(R + outline + 2, W - 1))):
        free = out[:, probe, 3] < 30            # nothing drawn further out on this row
        out[free, x0:x1, 3] = 0
        if x0 == 0 and x1 == L and L <= outline: out[:, :L, 3] = 0
    # the join columns themselves are solid wherever the wall is
    for x, nx in ((L, L + 1), (R, R - 1)):
        m = out[:, nx, 3] > 200; out[m, x, 3] = 255
    img = Image.fromarray(out.round().astype('uint8'), 'RGBA')
    bx = img.getbbox(); img = img.crop(bx)
    return img, {'left': L - bx[0], 'right': R - bx[0], 'width': img.width, 'height': img.height}

"""Builds the private Claude preview copy of the game from index.html.

The real app (GitHub Pages) is index.html as it is. The Claude link wraps pages in its own
document and doesn't allow offline helpers or local font files, so the preview copy:
  - drops the outer <!doctype>/<html>/<head>/<body> tags (the Claude link adds its own),
  - drops the install/app metadata (between APP-HEAD markers),
  - loads the font from Google Fonts instead of fonts/ (between FONT markers).
The game code itself is identical. Usage: python3 tools/build-preview.py  -> build/preview.html
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()


def cut(s, start, end, replacement=''):
    a = s.index(start)
    b = s.index(end, a) + len(end)
    return s[:a] + replacement + s[b:]


out = src
head_open = '<!doctype html>\n<html lang="en" dir="ltr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
assert out.startswith(head_open), 'index.html must start with the standard head'
out = out[len(head_open):]
out = cut(out, '<!-- APP-HEAD:START', '<!-- APP-HEAD:END -->\n')
out = cut(out, '  /* FONT:START', '/* FONT:END */\n')
out = out.replace('<style>\n', '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
                  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
                  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@600;800&display=swap">\n'
                  '<style>\n', 1)
assert out.count('</style>\n</head>\n<body>\n') == 1
out = out.replace('</style>\n</head>\n<body>\n', '</style>\n')
assert out.rstrip().endswith('</body>\n</html>')
out = out.rstrip()[:-len('</body>\n</html>')].rstrip() + '\n'
for bad in ('<!doctype', '<html', '<head>', '<body>', 'manifest.webmanifest', 'fonts/baloo'):
    assert bad not in out, bad

os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
dest = os.path.join(ROOT, 'build', 'preview.html')
open(dest, 'w', encoding='utf-8').write(out)
print('wrote', os.path.relpath(dest, ROOT), len(out), 'bytes')

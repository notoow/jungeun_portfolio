"""Remove only generated, unreferenced media inside this project's public/media."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
media=(root/'public/media').resolve()
assert media.is_relative_to(root.resolve())
projects=json.loads((root/'public/data/projects.json').read_text(encoding='utf8'))
used=set()
for project in projects:
    for image in [project['cover'],*project['images']]:
        for key in ['src','mini','poster']:
            if image.get(key):used.add((root/'public'/image[key]).resolve())
removed=0
for file in media.iterdir():
    target=file.resolve()
    assert target.parent==media
    if target.is_file() and target not in used:
        target.unlink();removed+=1
print('Unreferenced generated media removed:',removed)
print('Final media MiB:',round(sum(f.stat().st_size for f in media.iterdir())/1024**2,1))

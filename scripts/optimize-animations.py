"""Preserve animation while reducing transfer size; retain still posters."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ImageSequence
import json

root=Path(__file__).resolve().parents[1]
file=root/'public/data/projects.json'
projects=json.loads(file.read_text(encoding='utf8'))
items=[im for p in projects for im in p['images'] if im['src'].endswith('.gif')]

def convert(item):
    src=root/'public'/item['src']; dest=src.with_suffix('.webp')
    poster=src.with_name(src.stem+'-poster.webp')
    if dest.exists() and poster.exists():
        with Image.open(dest) as check:
            check.load()
            item.update(src='media/'+dest.name,width=check.width,height=check.height,animated=True,poster='media/'+poster.name)
            return src.stat().st_size,dest.stat().st_size,check.n_frames
    frames=[]; durations=[]
    with Image.open(src) as gif:
        for frame in ImageSequence.Iterator(gif):
            image=frame.convert('RGBA')
            image.thumbnail((960,1920),Image.Resampling.LANCZOS)
            frames.append(image);durations.append(frame.info.get('duration',100))
        frames[0].save(poster,'WEBP',quality=87)
        frames[0].save(dest,'WEBP',save_all=True,append_images=frames[1:],duration=durations,loop=gif.info.get('loop',0),quality=80,method=3)
    with Image.open(dest) as check:
        assert check.n_frames > 0  # WebP may merge identical consecutive frames.
        item.update(src='media/'+dest.name,width=check.width,height=check.height,animated=True,poster='media/'+poster.name)
    return src.stat().st_size,dest.stat().st_size,len(frames)

before=after=0
with ThreadPoolExecutor(max_workers=3) as pool:
    for n,f in enumerate(as_completed([pool.submit(convert,item) for item in items]),1):
        a,b,frames=f.result();before+=a;after+=b
        print(f'{n:02d}/{len(items)}: {a//1024} KiB -> {b//1024} KiB ({frames} frames)',flush=True)
file.write_text(json.dumps(projects,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print('Animation total MiB:',round(before/1024**2,1),'->',round(after/1024**2,1),flush=True)

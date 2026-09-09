"""Create tiny overview images and preserve animated originals when present."""
from pathlib import Path
from PIL import Image
import json,hashlib,shutil

root=Path(__file__).resolve().parents[1]
file=root/'public/data/projects.json'
projects=json.loads(file.read_text(encoding='utf-8'))
metadata=json.loads((root/'.import-cache/metadata.json').read_text(encoding='utf-8'))
animated=0
for p in projects:
    source=next(m for m in metadata if m['id']==p['id'])
    for i,url in enumerate(source['imageUrls']):
        cached=root/'.import-cache'/hashlib.sha256(url.encode()).hexdigest()
        with Image.open(cached) as img:
            if getattr(img,'n_frames',1)>1:
                name=f'{p["id"]}-{i:02d}-animated.gif'
                shutil.copyfile(cached,root/'public/media'/name)
                prefix=f'media/{p["id"]}-{i:02d}-'
                indices=[j for j,item in enumerate(p['images']) if item['src'].startswith(prefix)]
                at=indices[0]
                p['images']=[item for j,item in enumerate(p['images']) if j not in indices]
                p['images'].insert(at,{'src':f'media/{name}','width':img.width,'height':img.height})
                animated+=1
    for image in p['images']:
        src=root/'public'/image['src']
        mini=src.with_name(src.stem+'-mini.webp')
        with Image.open(src) as im:
            im.thumbnail((70,180),Image.Resampling.LANCZOS)
            im.convert('RGB').save(mini,'WEBP',quality=65,method=4)
        image['mini']='media/'+mini.name
    if p['id']=='1687063af42765':p['category']='Digital'
    if p['id']=='game-banner':p['category']='Game'
file.write_text(json.dumps(projects,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Projects:',len(projects),'animated originals:',animated,'detail sections:',sum(len(p['images']) for p in projects))

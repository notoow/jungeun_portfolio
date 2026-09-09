"""Import the owner's Adobe Portfolio into optimized, locally hosted assets."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin
from PIL import Image, ImageOps
from bs4 import BeautifulSoup
import requests, json, hashlib, io, time

ROOT = Path(__file__).resolve().parents[1]
CACHE, MEDIA, DATA = ROOT/'.import-cache', ROOT/'public/media', ROOT/'public/data'
for folder in (CACHE,MEDIA,DATA): folder.mkdir(parents=True,exist_ok=True)
BASE='https://infj.myportfolio.com/'

def fetch(url):
    name=CACHE/hashlib.sha256(url.encode()).hexdigest()
    if name.exists(): return name.read_bytes()
    for attempt in range(3):
        try:
            r=requests.get(url,timeout=60); r.raise_for_status()
            name.write_bytes(r.content)
            return r.content
        except Exception:
            if attempt==2: raise
            time.sleep(1+attempt)

def soup(url): return BeautifulSoup(fetch(url).decode('utf-8'),'html.parser')

def asset(url,slug,thumbnail=False):
    raw=fetch(url)
    img=ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
    if thumbnail: img.thumbnail((640,640),Image.Resampling.LANCZOS)
    elif img.width>1200: img=img.resize((1200,round(img.height*1200/img.width)),Image.Resampling.LANCZOS)
    if img.mode not in ('RGB','RGBA'): img=img.convert('RGB')
    result=[]
    chunk=2400 if not thumbnail else img.height
    for n,y in enumerate(range(0,img.height,chunk)):
        piece=img.crop((0,y,img.width,min(y+chunk,img.height)))
        filename=f'{slug}-{n:02d}.webp'
        target=MEDIA/filename
        if not target.exists(): piece.save(target,'WEBP',quality=87 if not thumbnail else 82,method=4)
        result.append({'src':f'media/{filename}','width':piece.width,'height':piece.height})
    return result

entries=[]
for i,a in enumerate(soup(BASE).select('a.project-cover')):
    title,cover=a.select_one('.title'),a.select_one('img')
    if not title or not cover: continue
    entries.append({'id':a['href'].strip('/'),'title':title.get_text(' ',strip=True),'url':urljoin(BASE,a['href']),'coverUrl':cover.get('data-src') or cover['src'],'order':i})

def metadata(e):
    s=soup(e['url']); h=s.select_one('.page-header')
    year=h.select_one('.date') if h else None
    description=h.select_one('.description') if h else None
    images=[]
    for img in s.select('#project-modules img'):
        parent=img.find_parent(class_='js-lightbox')
        u=img.get('data-src') or (parent.get('data-src') if parent else None) or img.get('src')
        if u and not u.startswith('data:'): images.append(urljoin(BASE,u))
    return {**e,'year':year.get_text(strip=True) if year else '', 'description':description.get_text(' ',strip=True) if description else '', 'imageUrls':list(dict.fromkeys(images)), 'embeds':[el['src'] for el in s.select('#project-modules iframe[src]')], 'text':[el.get_text('\n',strip=True) for el in s.select('#project-modules .module-text')]}

with ThreadPoolExecutor(max_workers=6) as pool: records=list(pool.map(metadata,entries))
(CACHE/'metadata.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Metadata: {len(records)} projects / {sum(len(p["imageUrls"]) for p in records)} source images',flush=True)

def category(p):
    name=p['title'].lower(); slug=p['id']
    if any(x in name for x in ['인스타','광고','배너']): return 'Social'
    if any(x in name for x in ['상세페이지','웹페이지','web page','다운 페이지']): return 'Digital'
    if slug in ['pizza-ready','dino-universe','snake-clash','prison-life','super-slime','3','lloha-land']: return 'Game'
    if slug in ['illustration','hamo','siromaro','167f8cebfbb164','5','soyaaplanet','dont-panic']: return 'Illustration'
    return 'Brand & Graphic'

def prepare(p):
    p['category']=category(p)
    p['cover']=asset(p['coverUrl'],p['id']+'-cover',True)[0]
    p['images']=[]
    for i,u in enumerate(p['imageUrls']): p['images'].extend(asset(u,f'{p["id"]}-{i:02d}'))
    p.pop('coverUrl',None);p.pop('imageUrls',None)
    return p

completed=[]
with ThreadPoolExecutor(max_workers=4) as pool:
    for f in as_completed([pool.submit(prepare,p) for p in records]):
        p=f.result(); completed.append(p)
        print(f'Imported {len(completed):02d}/{len(records)}: {p["id"]} ({len(p["images"])} sections)',flush=True)
completed.sort(key=lambda p:p['order'])
(DATA/'projects.json').write_text(json.dumps(completed,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'Complete: {len(completed)} projects, {sum(f.stat().st_size for f in MEDIA.iterdir())/1024/1024:.1f} MiB',flush=True)

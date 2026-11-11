import os, json, re, subprocess, datetime
SITE = 'https://12testershub.com'
IMG_EXT = ('.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif')

def lastmod(path):
    r = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', path], capture_output=True, text=True).stdout.strip()
    return r or datetime.date.today().isoformat()

# blog posts = folders in /blog that contain index.html (folders starting with _ or . are drafts)
posts = sorted(n for n in os.listdir('blog')
               if n[0] not in '._' and os.path.isfile(f'blog/{n}/index.html'))
os.makedirs('success-stories/images', exist_ok=True)
imgs = sorted(n for n in os.listdir('success-stories/images') if n.lower().endswith(IMG_EXT))

# ---- featured images: auto-pick one image per post from /blog-images/ (same slug -> same image, always)
os.makedirs('blog-images', exist_ok=True)
pics = sorted(n for n in os.listdir('blog-images') if n.lower().endswith(IMG_EXT))
json.dump(pics, open('blog-images/images.json', 'w'))

def pick(slug):
    h = 0
    for ch in slug:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return '/blog-images/' + pics[h % len(pics)]

featured = {}
for slug in posts:
    f = f'blog/{slug}/index.html'
    html = open(f, encoding='utf-8').read()
    own = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]*content=["\']([^"\']+)', html)
    url = own.group(1) if own else (pick(slug) if pics else '')
    if not url:
        continue
    featured[slug] = url
    if own:
        continue                                   # post has its own image: leave it untouched
    absu = url if url.startswith('http') else SITE + url
    meta = (f'<meta property="og:image" content="{absu}">\n'
            + ('' if 'twitter:card' in html else '<meta name="twitter:card" content="summary_large_image">\n')
            + f'<meta name="twitter:image" content="{absu}">\n')
    html = html.replace('</head>', meta + '</head>', 1)
    # show the image under the H1 (skip if the post already has an image there or says <!-- no-featured -->)
    m = re.search(r'</h1>', html)
    if m and '<!-- no-featured -->' not in html and '<!-- featured -->' not in html:
        tail = html[m.end():]
        nxt = re.search(r'<h2', tail)
        if not re.search(r'<img\b', tail[:nxt.start() if nxt else 2000]):
            fig = ('<!-- featured --><figure style="margin:24px 0"><img src="%s" alt="" width="1200" height="675" '
                   'style="width:100%%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:16px;display:block" '
                   'fetchpriority="high" decoding="async"></figure>' % url)
            html = html[:m.end()] + fig + html[m.end():]
    open(f, 'w', encoding='utf-8').write(html)
json.dump(featured, open('blog/featured.json', 'w'))
json.dump(posts, open('blog/posts.json', 'w'))
json.dump(imgs, open('success-stories/images/images.json', 'w'))

pages = [('/', 'index.html', '1.0'), ('/success-stories.html', 'success-stories.html', '0.8'),
         ('/faq.html', 'faq.html', '0.8'), ('/blog/', 'blog/index.html', '0.8'),
         ('/about.html', 'about.html', '0.5'), ('/contact.html', 'contact.html', '0.5')]
pages += [(f'/blog/{p}/', f'blog/{p}/index.html', '0.7') for p in posts]
pages += [(f'/{n}.html', f'{n}.html', '0.2') for n in ('privacy', 'terms', 'refund-policy')]

xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for url, f, pr in pages:
    xml += f'  <url><loc>{SITE}{url}</loc><lastmod>{lastmod(f)}</lastmod><priority>{pr}</priority></url>\n'
open('sitemap.xml', 'w').write(xml + '</urlset>\n')
print(f'{len(posts)} posts, {len(imgs)} images, {len(pages)} sitemap urls')

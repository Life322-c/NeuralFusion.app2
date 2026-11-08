#!/usr/bin/env python3
"""Apply the shared public navigation to every static page.

The site has no build step, so the nav markup is written into each page (it must exist without JavaScript
for crawlers and no-JS visitors). This script is the single source of truth for that markup.

  python3 tools/apply-nav.py            rewrite the header of every static page
  python3 tools/apply-nav.py --check    verify every page already matches (exit 1 on drift)

The React app (app.js) defines the same three groups in NF_LINK_GROUPS; `--check` also compares them.
"""
import re, sys, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VER = '1'

# (id, label, [(label, href)])  Labels and order mirror NF_LINK_GROUPS in app.js.
GROUPS = [
    ('pathways', 'Pathways', [
        ('For Organisations', '/organisations'),
        ('Academic Partnerships', '/academic-partnerships'),
        ('Executive Programme', '/executive'),
        ('Take the CFI', '/?view=cfi'),
        ('NeuralFusion for Teams', '/?view=teams'),
    ]),
    ('understand', 'Understand', [
        ('The Four Thinking Modes', '/thinking'),
        ('Cognitive fragmentation', '/cognitive-fragmentation'),
        ('Decision-making', '/decision-making'),
        ('CFI methodology', '/methodology'),
        ('Research', '/research'),
        ('Blog', '/blog'),
    ]),
    ('company', 'Company', [
        ('About', '/about'),
        ('Contact', '/contact'),
        ('Privacy', '/privacy'),
        ('Terms', '/terms'),
    ]),
]

# Which nav link is "current" on a page (file path relative to ROOT -> href). Pages not listed have none.
CURRENT = {
    'organisations.html': '/organisations', 'academic-partnerships.html': '/academic-partnerships',
    'executive.html': '/executive', 'thinking.html': '/thinking', 'cognitive-fragmentation.html': '/cognitive-fragmentation',
    'decision-making.html': '/decision-making', 'methodology.html': '/methodology', 'research.html': '/research',
    'about.html': '/about', 'contact.html': '/contact', 'privacy.html': '/privacy', 'terms.html': '/terms',
}
SKIP = {'index.html', 'google0fa2b28e9dd5d7fa.html'}  # index.html is the React app: see PublicNav in app.js

LOGO = ('<svg width="18" height="18" viewBox="0 0 100 100" aria-hidden="true" focusable="false">'
        '<rect x="13" y="13" width="14" height="74" fill="currentColor"/>'
        '<polygon points="27,13 41,13 71,87 57,87" fill="currentColor"/>'
        '<rect x="57" y="13" width="14" height="74" fill="currentColor"/>'
        '<rect x="57" y="13" width="30" height="14" fill="currentColor"/>'
        '<rect x="57" y="44" width="24" height="14" fill="currentColor"/></svg>')
CHEV = '<svg class="nfx-chev" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>'


def current_for(rel):
    if rel in CURRENT: return CURRENT[rel]
    if rel.startswith('blog/'): return '/blog'
    return None


def render_header(current):
    out = ['<header class="nfx-header">', '  <div class="nfx-bar">',
           '    <a class="nfx-brand" href="/" aria-label="NeuralFusion home">%s<span>NeuralFusion</span></a>' % LOGO,
           '    <button class="nfx-toggle" type="button" aria-expanded="false" aria-controls="nfx-nav" aria-label="Open menu"><span class="nfx-bars" aria-hidden="true"></span></button>',
           '    <nav class="nfx-nav" id="nfx-nav" aria-label="Primary">',
           '      <ul class="nfx-groups">']
    for gid, label, items in GROUPS:
        has = any(h == current for _, h in items)
        out.append('        <li class="nfx-group%s">' % (' has-current' if has else ''))
        out.append('          <button class="nfx-trigger" type="button" id="nfx-t-%s" aria-expanded="false" aria-controls="nfx-p-%s">%s%s</button>' % (gid, gid, label, CHEV))
        out.append('          <div class="nfx-panel" id="nfx-p-%s"><ul>' % gid)
        for text, href in items:
            cur = ' aria-current="page"' if href == current else ''
            out.append('            <li><a href="%s"%s>%s</a></li>' % (href, cur, text))
        out.append('          </ul></div>')
        out.append('        </li>')
    out += ['      </ul>',
            '      <div class="nfx-actions">',
            '        <a class="nfx-signin" href="/?auth=login" data-track="signin_click" data-where="header">Sign in</a>',
            '        <a class="nfx-cta" href="/?view=cfi" data-track="cfi_cta_click" data-where="header">Take the CFI</a>',
            '      </div>', '    </nav>', '  </div>', '</header>']
    return '\n'.join(out)


FONT_LINK = ('<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;family=Space+Mono:wght@400;700&amp;display=swap" rel="stylesheet" />')
HEAD_ASSETS = '<link rel="stylesheet" href="/nf-nav.css?v=%s" />\n<script src="/nf-nav.js?v=%s"></script>\n' % (VER, VER)


def pages():
    files = sorted(glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, 'blog', '*.html')))
    for f in files:
        rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
        if rel not in SKIP: yield f, rel


def transform(s, rel):
    cur = current_for(rel)
    hdr = render_header(cur)
    m = re.search(r'<header[\s>].*?</header>', s, re.S)
    if not m: raise SystemExit('no <header> in ' + rel)
    s = s[:m.start()] + hdr + s[m.end():]
    # drop the old shared nav assets / legacy nav CSS, then (re)insert the new ones once
    s = re.sub(r'<link rel="stylesheet" href="/nf-nav\.css[^>]*>\n?', '', s)
    s = re.sub(r'<script src="/nf-nav\.js[^>]*></script>\n?', '', s)
    s = re.sub(r'\n[ \t]*/\* Shared public navigation \(added with the commercial pages\) \*/\n(?:[ \t]*\.legacy-nav[^\n]*\n)+', '\n', s)
    s = re.sub(r'\n[ \t]*@media \(max-width: 960px\) \{\n[ \t]*\.site-header \{[^\n]*\n[ \t]*\.legacy-nav \{[^\n]*\n[ \t]*\}\n', '\n', s)
    add = HEAD_ASSETS
    if 'DM+Sans' not in s and 'DM Sans' not in s: add = FONT_LINK + '\n' + add
    s = s.replace('</head>', add + '</head>', 1)
    return s


def norm_header(s):
    m = re.search(r'<header class="nfx-header">.*?</header>', s, re.S)
    return re.sub(r' aria-current="page"| has-current', '', m.group(0)) if m else None


def check_app_js():
    js = open(os.path.join(ROOT, 'app.js'), encoding='utf-8').read()
    m = re.search(r'const NF_LINK_GROUPS = \[(.*?)\n    \];', js, re.S)
    if not m: return ['NF_LINK_GROUPS not found in app.js']
    block = m.group(1)
    got = []
    for gm in re.finditer(r"title: '([A-Z]+)', items: \[(.*?)\] \}", block, re.S):
        items = re.findall(r"label: '([^']+)', (?:href: '([^']+)'|v: '([^']+)')", gm.group(2))
        got.append((gm.group(1).lower(), [(l, h or '/?view=' + v) for l, h, v in items]))
    want = [(gid, [(t, h) for t, h in items]) for gid, _, items in GROUPS]
    errs = []
    if got != want: errs.append('app.js NF_LINK_GROUPS differs from tools/apply-nav.py GROUPS:\n  app.js : %r\n  script : %r' % (got, want))
    return errs


def main():
    check = '--check' in sys.argv
    problems, ref = [], None
    for f, rel in pages():
        s = open(f, encoding='utf-8').read()
        if check:
            nh = norm_header(s)
            if nh is None: problems.append('%s: no nfx-header' % rel); continue
            ref = ref or nh
            if nh != ref: problems.append('%s: header markup differs from the other pages' % rel)
            if render_header(current_for(rel)) not in s: problems.append('%s: header is not the generated markup (or wrong current page)' % rel)
            if '/nf-nav.css' not in s or '/nf-nav.js' not in s: problems.append('%s: missing nf-nav.css/js' % rel)
        else:
            t = transform(s, rel)
            if t != s: open(f, 'w', encoding='utf-8').write(t)
            print('updated', rel, '(current: %s)' % current_for(rel))
    if check:
        problems += check_app_js()
        if problems:
            print('\n'.join(problems)); sys.exit(1)
        print('OK: all static pages share identical nav markup; app.js groups match.')

if __name__ == '__main__':
    main()

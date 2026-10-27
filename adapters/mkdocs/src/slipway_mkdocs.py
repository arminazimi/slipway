import json
import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
from mkdocs.plugins import BasePlugin

front_matter_re = re.compile(r'^---[\s\S]*?^---\s*\n', re.MULTILINE)
inline_link_re = re.compile(r'(!?)\[(?:[^\[\]\n]|\[[^\[\]\n]*\])*\]\(\s*<?([^\s<>()]+(?:\([^\s()]*\)[^\s<>()]*)*)>?(?:\s+(?:"[^"\n]*"|\'[^\'\n]*\'))?\s*\)')
fence_re = re.compile(r'^ {0,3}(`{3,}|~{3,})')

def split_front_matter(raw):
    match = front_matter_re.match(raw)
    if not match:
        return raw, 0
    return raw[len(match.group(0)):], match.group(0).count('\n')

def links_in(raw):
    lines = raw.split('\n')
    _, offset = split_front_matter(raw)
    links = []
    open_fence = None

    for i in range(offset, len(lines)):
        line = lines[i]
        marker = fence_re.match(line)
        if open_fence:
            if marker and marker.group(1)[0] == open_fence[0] and len(marker.group(1)) >= len(open_fence) and not line[len(marker.group(0)):].strip():
                open_fence = None
            continue
        if marker:
            open_fence = marker.group(1)
            continue

        def repl(m):
            return " " * len(m.group(0))
        clean_line = re.sub(r'(`+)[\s\S]*?\1', repl, line)

        for match in inline_link_re.finditer(clean_line):
            if not match.group(1):
                links.append({'href': match.group(2), 'line': i + 1})

    return links

class SlipwayPlugin(BasePlugin):
    def on_config(self, config, **kwargs):
        self.pages = []
        return config

    def on_page_markdown(self, markdown, page, config, files):
        if not page.file.src_uri.endswith('.md'):
            return markdown

        raw_path = Path(config['docs_dir']) / page.file.src_uri
        with open(raw_path, 'r', encoding='utf-8') as f:
            raw_content = f.read()
        _, offset = split_front_matter(raw_content)

        # We need to map HTML headings to their markdown lines.
        # Python-Markdown allows extending, but we can do a simpler text-based mapping here
        # or use mkdocs' AST (not easily exposed).
        # We'll just pass offset and raw_content to on_post_page.
        page.slipway_offset = offset
        page.slipway_raw = raw_content
        return markdown

    def on_post_page(self, output, page, config, **kwargs):
        if not hasattr(page, 'slipway_offset'):
            return output

        soup = BeautifulSoup(output, 'html.parser')

        url_path = page.url
        if url_path.endswith('/'):
            twin_url = f"/{url_path}index.md"
        elif url_path == '':
            twin_url = "/index.md"
        else:
            twin_url = f"/{url_path[:-5]}.md" if url_path.endswith('.html') else f"/{url_path}.md"

        link = soup.new_tag('link', rel='alternate', type='text/markdown', href=twin_url)
        if soup.head:
            soup.head.append(link)

        source_rel = f"docs/{page.file.src_uri}"

        # Match headings
        lines = page.slipway_raw.split('\n')
        offset = page.slipway_offset

        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        sections = []

        # simple heuristic for line numbers: search the markdown text
        last_found_line = offset
        for h in headings:
            text = h.get_text().strip()
            level = int(h.name[1])
            # search for the text in markdown lines starting from last_found_line
            # This is an approximation. A more robust way is what remark does.
            for i in range(last_found_line, len(lines)):
                if text.lower() in lines[i].lower() and lines[i].lstrip().startswith('#'):
                    h['data-source'] = f"{source_rel}:{i+1}"
                    if h.get('id'):
                        sections.append({
                            'id': h.get('id'),
                            'level': level,
                            'line': i + 1,
                            'text': text
                        })
                    last_found_line = i + 1
                    break

        # Update output with data-source attributes
        output = str(soup)

        self.pages.append({
            'url': f"/{page.url}" if not page.url.startswith('/') else page.url,
            'source': source_rel,
            'sections': sections,
            'links': links_in(page.slipway_raw),
            'raw': page.slipway_raw,
            'title': page.title,
        })

        return output

    def on_post_build(self, config, **kwargs):
        site_dir = Path(config['site_dir'])

        sourcemap = {
            'version': 0,
            'pages': []
        }

        for p in self.pages:
            url = p['url']
            source = p['source']
            raw_content = p['raw']
            title = p['title']

            body, _ = split_front_matter(raw_content)

            twin_content = body.lstrip()
            if title and not re.match(r'^#[ \t]', twin_content):
                twin_content = f"# {title}\n\n{twin_content}"

            if url.endswith('/'):
                twin_path = site_dir / url.lstrip('/') / 'index.md'
            elif url == '/':
                twin_path = site_dir / 'index.md'
            else:
                twin_path = site_dir / url.lstrip('/')
                if twin_path.suffix == '.html':
                    twin_path = twin_path.with_suffix('.md')
                else:
                    twin_path = twin_path.with_name(f"{twin_path.name}.md")

            os.makedirs(twin_path.parent, exist_ok=True)
            with open(twin_path, 'w', encoding='utf-8') as f:
                f.write(twin_content)

            page_data = {
                'url': url,
                'source': source,
            }
            if p.get('sections'):
                page_data['sections'] = p['sections']
            if p.get('links'):
                page_data['links'] = p['links']

            sourcemap['pages'].append(page_data)

        with open(site_dir / 'sourcemap.json', 'w', encoding='utf-8') as f:
            json.dump(sourcemap, f, indent=2)

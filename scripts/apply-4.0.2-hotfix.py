from pathlib import Path
import json
import re

css = Path('styles.css')
text = css.read_text()
marker = '/* === 4.0.2 modular clock positioning hotfix === */'
if marker not in text:
    text += """

/* === 4.0.2 modular clock positioning hotfix === */
.interactive-clock{--clock-node-radius:clamp(96px,30vw,136px)}
.clock-node{--radius:var(--clock-node-radius)}
@media(max-width:420px){.interactive-clock{--clock-node-radius:clamp(86px,29vw,102px)}}
"""
css.write_text(text)

pkg = Path('package.json')
data = json.loads(pkg.read_text())
data['version'] = '4.0.2'
pkg.write_text(json.dumps(data, indent=2) + '\n')

index = Path('index.html')
text = index.read_text()
text = text.replace('4.0.0-interactive', '4.0.2-hotfix')
text = text.replace('v4.0 interactive', 'v4.0.2')
index.write_text(text)

sw = Path('sw.js')
text = sw.read_text()
text = re.sub(r"const CACHE_NAME = '[^']+';", "const CACHE_NAME = 'cryptic-quest-v4-0-2-mod-clock-20260814';", text, count=1)
text = text.replace('4.0.0-interactive', '4.0.2-hotfix')
sw.write_text(text)

notes = Path('RELEASE_NOTES.md')
current = notes.read_text() if notes.exists() else ''
header = """# Cryptic Quest 4.0.2 — Modular Clock Hotfix

- Fixes modular-clock number buttons collapsing near the center of the dial.
- Uses a responsive length-based clock radius instead of a percentage transform radius.
- Extends the existing Playwright browser smoke test to verify clock geometry and click handling.
- Refreshes PWA cache/version metadata so the corrected CSS is fetched cleanly.

"""
if not current.startswith('# Cryptic Quest 4.0.2'):
    notes.write_text(header + current)

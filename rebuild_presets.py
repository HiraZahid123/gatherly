import os
import re

themes_dir = 'public/themes'
effects_dir = 'public/effects'

def camel_to_title(s):
    # e.g. darkSky -> Dark Sky
    res = ''
    for c in s:
        if c.isupper():
            res += ' ' + c
        else:
            res += c
    return res.strip().title()

themes = []
if os.path.exists(themes_dir):
    for f in sorted(os.listdir(themes_dir)):
        p = os.path.join(themes_dir, f)
        if os.path.isdir(p):
            label = camel_to_title(f)
            # check if mp4 or jpg exists
            is_video = os.path.exists(os.path.join(p, 'web.mp4'))
            url = f'/themes/{f}/web.mp4' if is_video else f'/themes/{f}/web.jpg'
            category = 'Animated' if is_video else 'Static'
            type_val = 'video' if is_video else 'image'
            themes.append(f'''    {{
        "id": "{f}",
        "label": "{label}",
        "category": "{category}",
        "type": "{type_val}",
        "url": "{url}",
        "thumbnail": "linear-gradient(to bottom right, #ffffff, #a0aec0)"
    }}''')

effects = []
if os.path.exists(effects_dir):
    for f in sorted(os.listdir(effects_dir)):
        p = os.path.join(effects_dir, f)
        if os.path.isdir(p):
            label = camel_to_title(f)
            url = f'/effects/{f}/web.webm'
            # special cases from list_dir
            if f == 'soccer':
                url = '/effects/soccer.webm'
            effects.append(f'''    {{
        "id": "{f}",
        "label": "{label}",
        "videoUrl": "{url}"
    }}''')

theme_str = 'export const ANIMATED_THEME_PRESETS = [\n' + ',\n'.join(themes) + '\n];'
effect_str = 'export const VIDEO_VFX_PRESETS = [\n' + ',\n'.join(effects) + '\n];'

with open('src/components/ThemeSelector.tsx', 'r', encoding='utf-8') as f:
    tc = f.read()

tc = re.sub(r'export const ANIMATED_THEME_PRESETS = \[.*?\];', theme_str, tc, flags=re.DOTALL)
with open('src/components/ThemeSelector.tsx', 'w', encoding='utf-8') as f:
    f.write(tc)

with open('src/components/EffectSelector.tsx', 'r', encoding='utf-8') as f:
    ec = f.read()

ec = re.sub(r'export const VIDEO_VFX_PRESETS = \[.*?\];', effect_str, ec, flags=re.DOTALL)
with open('src/components/EffectSelector.tsx', 'w', encoding='utf-8') as f:
    f.write(ec)

print('Restored dynamically from directories')

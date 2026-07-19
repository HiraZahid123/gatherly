import os
import re

effects_dir = 'public/effects'

def camel_to_title(s):
    res = ''
    for c in s:
        if c.isupper():
            res += ' ' + c
        else:
            res += c
    return res.strip().title()

effects = []
if os.path.exists(effects_dir):
    for f in sorted(os.listdir(effects_dir)):
        p = os.path.join(effects_dir, f)
        if os.path.isdir(p):
            label = camel_to_title(f)
            url = f'/effects/{f}/web.webm'
            type_val = 'video'
            
            # Check for json
            if f == 'confetti':
                url = ''
                type_val = 'icon'
            elif os.path.exists(os.path.join(p, 'web.json')):
                url = f'/effects/{f}/web.json'
                type_val = 'lottie'
            elif os.path.exists(os.path.join(p, 'web_front.json')):
                url = f'/effects/{f}/web_front.json'
                type_val = 'lottie'
            elif os.path.exists(os.path.join(p, 'web.webm')):
                url = f'/effects/{f}/web.webm'
                type_val = 'video'
            elif f == 'soccer':
                url = '/effects/soccer.webm'
                type_val = 'video'
                
            effects.append(f'''    {{
        "id": "{f}",
        "label": "{label}",
        "type": "{type_val}",
        "videoUrl": "{url}"
    }}''')

effect_str = 'export const VIDEO_VFX_PRESETS = [\n' + ',\n'.join(effects) + '\n];'

with open('src/components/EffectSelector.tsx', 'r', encoding='utf-8') as f:
    ec = f.read()

ec = re.sub(r'export const VIDEO_VFX_PRESETS = \[.*?\];', effect_str, ec, flags=re.DOTALL)
with open('src/components/EffectSelector.tsx', 'w', encoding='utf-8') as f:
    f.write(ec)

print('Updated presets with Lottie support')

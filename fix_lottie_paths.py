import os
import json

effects_dir = 'public/effects'

if os.path.exists(effects_dir):
    for f in os.listdir(effects_dir):
        p = os.path.join(effects_dir, f, 'web.json')
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            modified = False
            if 'assets' in data:
                for asset in data['assets']:
                    if 'u' in asset and asset['u'] == 'images/':
                        asset['u'] = f'/effects/{f}/images/'
                        modified = True
                        print(f'Fixed asset path in {f}')
            
            if modified:
                with open(p, 'w', encoding='utf-8') as file:
                    json.dump(data, file, separators=(',', ':'))

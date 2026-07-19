import json, os

transcript_path = os.path.join(r'C:\Users\SHUAIB LAPTOP\.gemini\antigravity-ide\brain\494b746d-b806-4f8a-bcc9-26e49a167657\.system_generated\logs', 'transcript.jsonl')
t_content = None
e_content = None

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'content' in data:
                c = data['content']
                if 'ThemeSelector.tsx`\nTotal Lines: 659' in c:
                    parsed = []
                    for l in c.split('\n'):
                        if ': ' in l and len(l.split(': ', 1)) == 2:
                            parsed.append(l.split(': ', 1)[1])
                    try:
                        idx = parsed.index('"use client";')
                        t_content = '\n'.join(parsed[idx:])
                    except ValueError:
                        pass
                if 'EffectSelector.tsx`\nTotal Lines: 555' in c:
                    parsed = []
                    for l in c.split('\n'):
                        if ': ' in l and len(l.split(': ', 1)) == 2:
                            parsed.append(l.split(': ', 1)[1])
                    try:
                        idx = parsed.index('"use client";')
                        e_content = '\n'.join(parsed[idx:])
                    except ValueError:
                        pass
        except Exception as e:
            pass

if t_content:
    with open('src/components/ThemeSelector.tsx', 'w', encoding='utf-8') as f: 
        f.write(t_content)
    print('Restored ThemeSelector.tsx')
if e_content:
    with open('src/components/EffectSelector.tsx', 'w', encoding='utf-8') as f: 
        f.write(e_content)
    print('Restored EffectSelector.tsx')

# Empacota os .glb usados pelo jogo em js/models_data.js (base64),
# para o index.html funcionar abrindo direto do disco (file://), sem servidor.
import base64, json, os, re, sys

game = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(game, 'js', 'assets.js'), encoding='utf-8').read()
files = sorted(set(re.findall(r"file:\s*'([^']+)'", src)))
credits = json.load(open(os.path.join(game, 'models', 'credits.json'), encoding='utf-8'))
used_credits = [c for c in credits if c['file'][:-4] in files]

out = ['// Gerado por tools/pack_models.py — modelos 3D (poly.pizza) em base64', 'window.MODEL_DATA = {']
total = 0
for f in files:
    p = os.path.join(game, 'models', f + '.glb')
    data = open(p, 'rb').read()
    total += len(data)
    out.append(f'  "{f}": "{base64.b64encode(data).decode()}",')
out.append('};')
out.append('window.MODEL_CREDITS = ' + json.dumps(used_credits, ensure_ascii=False) + ';')
open(os.path.join(game, 'js', 'models_data.js'), 'w', encoding='utf-8').write('\n'.join(out))

# remove .glb que o jogo não usa
removed = []
for name in os.listdir(os.path.join(game, 'models')):
    if name.endswith('.glb') and name[:-4] not in files:
        os.remove(os.path.join(game, 'models', name)); removed.append(name)
json.dump(used_credits, open(os.path.join(game, 'models', 'credits.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(f'{len(files)} modelos, {total/1024/1024:.1f} MB; removidos: {removed}')

# Empacota o jogo em game.zip (vai embutido no .exe)
import os, sys, zipfile
game, out = sys.argv[1], sys.argv[2]
if os.name == 'nt' and not game.startswith('\\\\?\\'):
    game = '\\\\?\\' + os.path.abspath(game)   # permite caminhos com mais de 260 caracteres
skip_dirs = {'tools', 'models'}          # os modelos já estão em js/models_data.js
n = 0
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for root, dirs, files in os.walk(game):
        rel = os.path.relpath(root, game)
        if rel.split(os.sep)[0] in skip_dirs: continue
        for f in files:
            p = os.path.join(root, f)
            arc = os.path.relpath(p, game).replace(os.sep, '/')
            # mp3/ogg já são comprimidos
            ct = zipfile.ZIP_STORED if f.endswith(('.mp3', '.ogg', '.png', '.woff2')) else zipfile.ZIP_DEFLATED
            z.write(p, arc, compress_type=ct); n += 1
print(n, 'arquivos,', round(os.path.getsize(out) / 1024 / 1024, 1), 'MB')

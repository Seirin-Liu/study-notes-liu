from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
destination = root / 'zhixu-local.zip'
files = ['server.mjs', 'package.json', 'package-lock.json', 'README.md', 'AGENTS.md', 'QUESTION_FORMAT.md', 'start-local.cmd', 'start-local.sh', 'start-local.command', 'data/questions.json']
for directory in ['dist', 'lib', 'scripts', 'examples', 'tests', 'docs']:
    files.extend(str(path.relative_to(root)) for path in (root / directory).rglob('*') if path.is_file() and '__pycache__' not in path.parts)
files.extend(str(path.relative_to(root)) for path in (root / 'data' / 'assets').rglob('*') if path.is_file())
with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED) as archive:
    for relative in sorted(set(files)):
        source = root / relative
        if source.is_file():
            archive.write(source, 'zhixu-local/' + relative)
print(destination)

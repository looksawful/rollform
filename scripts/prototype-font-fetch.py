from pathlib import Path
import requests
root=Path('A:/AgentWork/scratch/rollform-font-build')
root.mkdir(parents=True,exist_ok=True)
urls={
 'nova-flat':'https://raw.githubusercontent.com/wmk69/Nova/master/NovaFlat-Bold.ttf',
 'square-antiqua':'https://raw.githubusercontent.com/wmk69/Square-Antiqua/master/SquareAntiqua-Bold.ttf',
 'simply-serif':'https://raw.githubusercontent.com/wmk69/Simply-Serif/master/SimplySerif-Bold.ttf',
 'simply-mono':'https://raw.githubusercontent.com/wmk69/Simply-Mono/master/SimplyMono-Bold.ttf',
}
for key,url in urls.items():
  r=requests.get(url,timeout=20);r.raise_for_status()
  assert r.content[:4] in (b'\x00\x01\x00\x00',b'OTTO')
  (root/(key+'.ttf')).write_bytes(r.content)
  print(key,len(r.content))

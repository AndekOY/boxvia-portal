"""Fail sandbox build on PDF structure, missing text, overflow or missing logo."""
from pathlib import Path
import fitz

p=Path("assets/reports/everyday-claims/EDC-004_ChatGPT_Free_SUPPORTED_EN.pdf")
d=fitz.open(p)
assert len(d)==2, f"expected exactly 2 pages, found {len(d)}"
expected=[
 ["Evidence Assessment Report","01 Claim under assessment","02 Identified primary source","03 Assessment boundary","04 Evidence extracted from the source","05 Evidence standing","SUPPORTED","1 / 2"],
 ["Reasoning & Methodological Record","06 Assessment reasoning","07 Uncertainty and limitations","08 Traceability record","09 Methodological basis","10 Scope and reliance notice","2 / 2"],
]
for i,page in enumerate(d):
 assert abs(page.rect.width-595.28)<2 and abs(page.rect.height-841.89)<2, "not A4"
 s=page.get_text()
 for term in expected[i]:
  assert term in s, f"page {i+1}: missing {term}"
 assert "https://boxvia.andeks.workers.dev/" in s, f"page {i+1}: missing footer"
 assert page.get_images(full=True), f"page {i+1}: missing embedded BoxVia logo"
 links=page.get_links()
 assert any(x.get("uri","").startswith("https://boxvia.andeks.workers.dev/") for x in links), f"page {i+1}: footer not clickable"
 for block in page.get_text("dict")["blocks"]:
  if block.get("type")!=0:continue
  for line in block.get("lines",[]):
   for span in line.get("spans",[]):
    box=fitz.Rect(span["bbox"])
    assert box.x0>=20 and box.x1<=page.rect.width-20, f"page {i+1}: horizontal overflow {span['text']!r}"
    assert box.y0>=15 and box.y1<=page.rect.height-15, f"page {i+1}: vertical overflow {span['text']!r}"
 print(f"Page {i+1}: A4, sections, logo, footer link and text bounds PASS")
print("EDC-004 automated PDF preflight PASS (not a substitute for human visual review)")

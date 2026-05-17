import JSZip from "jszip";

export interface ParsedSlide {
  id: string;
  canvasJson: string;
  order: number;
}

function emuToPx(emu: number): number {
  return Math.round(emu / 9525); // 914400 EMU/inch ÷ 96px/inch
}

function parseColor(node: Element | null): string {
  if (!node) return "#000000";
  const solidFill = node.querySelector("solidFill");
  if (!solidFill) return "#000000";
  const srgb = solidFill.querySelector("srgbClr");
  if (srgb) return "#" + (srgb.getAttribute("val") ?? "000000");
  const scheme = solidFill.querySelector("schemeClr");
  if (scheme) return "#334155"; // fallback slate
  return "#000000";
}

function parseTextFromTxBody(txBody: Element): { text: string; fontSize: number; bold: boolean; color: string } {
  const paras = Array.from(txBody.querySelectorAll("p"));
  const lines: string[] = [];
  let fontSize = 24;
  let bold = false;
  let color = "#000000";

  for (const p of paras) {
    const runs = Array.from(p.querySelectorAll("r"));
    const lineText = runs.map(r => r.querySelector("t")?.textContent ?? "").join("");
    lines.push(lineText);
    // Pick props from first run
    if (runs[0]) {
      const rPr = runs[0].querySelector("rPr");
      if (rPr) {
        const sz = rPr.getAttribute("sz");
        if (sz) fontSize = parseInt(sz) / 100;
        bold = rPr.getAttribute("b") === "1";
        color = parseColor(rPr);
      }
    }
  }

  return { text: lines.join("\n"), fontSize, bold, color };
}

export async function parsePptx(file: File): Promise<ParsedSlide[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const parser = new DOMParser();
  const slides: ParsedSlide[] = [];

  // Find slide files
  const slideFiles = Object.keys(zip.files)
    .filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0");
      const nb = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0");
      return na - nb;
    });

  for (let idx = 0; idx < slideFiles.length; idx++) {
    const xmlStr = await zip.files[slideFiles[idx]].async("string");
    const doc = parser.parseFromString(xmlStr, "text/xml");
    const objects: object[] = [];

    // Parse shapes (sp elements)
    const shapes = doc.querySelectorAll("sp");
    for (const sp of Array.from(shapes)) {
      const xfrm = sp.querySelector("xfrm");
      if (!xfrm) continue;

      const off = xfrm.querySelector("off");
      const ext = xfrm.querySelector("ext");
      const left = emuToPx(parseInt(off?.getAttribute("x") ?? "0"));
      const top = emuToPx(parseInt(off?.getAttribute("y") ?? "0"));
      const width = emuToPx(parseInt(ext?.getAttribute("cx") ?? "914400"));
      const height = emuToPx(parseInt(ext?.getAttribute("cy") ?? "685800"));

      const txBody = sp.querySelector("txBody");
      const prstGeom = sp.querySelector("prstGeom");
      const preset = prstGeom?.getAttribute("prst") ?? "rect";

      if (txBody) {
        const { text, fontSize, bold, color } = parseTextFromTxBody(txBody);
        if (text.trim()) {
          objects.push({
            type: "Textbox",
            left, top, width, height,
            text,
            fontSize,
            fontFamily: "Inter",
            fontWeight: bold ? "bold" : "normal",
            fill: color,
            textAlign: "left",
          });
        }
      } else {
        // Shape
        const fillColor = parseColor(sp.querySelector("spPr"));
        const type = preset === "ellipse" ? "Circle" : "Rect";
        objects.push({
          type,
          left, top, width,
          height: type === "Circle" ? Math.min(width, height) : height,
          radius: type === "Circle" ? Math.min(width, height) / 2 : undefined,
          fill: fillColor,
          rx: 0,
        });
      }
    }

    // Parse images (pic elements)
    const pics = doc.querySelectorAll("pic");
    for (const pic of Array.from(pics)) {
      const xfrm = pic.querySelector("xfrm");
      if (!xfrm) continue;
      const off = xfrm.querySelector("off");
      const ext = xfrm.querySelector("ext");
      const left = emuToPx(parseInt(off?.getAttribute("x") ?? "0"));
      const top = emuToPx(parseInt(off?.getAttribute("y") ?? "0"));
      const width = emuToPx(parseInt(ext?.getAttribute("cx") ?? "914400"));
      const height = emuToPx(parseInt(ext?.getAttribute("cy") ?? "685800"));
      // Image will be a placeholder — actual image extraction requires relationship lookup
      objects.push({
        type: "Rect",
        left, top, width, height,
        fill: "#94a3b8",
        rx: 4,
      });
    }

    slides.push({
      id: crypto.randomUUID(),
      order: idx,
      canvasJson: JSON.stringify({
        version: "6.0.0",
        objects,
        background: "#ffffff",
      }),
    });
  }

  return slides;
}

import PptxGenJS from "pptxgenjs";

const PX_PER_INCH = 96;
function px(v: number) { return v / PX_PER_INCH; }

interface FabricObj {
  type: string;
  left?: number; top?: number;
  width?: number; height?: number;
  scaleX?: number; scaleY?: number;
  angle?: number; opacity?: number;
  fill?: string; stroke?: string; strokeWidth?: number;
  text?: string; fontSize?: number; fontFamily?: string;
  fontWeight?: string; fontStyle?: string; underline?: boolean;
  textAlign?: string;
  rx?: number; radius?: number;
  src?: string;
  x1?: number; y1?: number; x2?: number; y2?: number;
}

function hexColor(c: string | undefined, fallback = "FFFFFF"): string {
  if (!c || c === "transparent") return fallback;
  if (c.startsWith("#")) return c.slice(1).padEnd(6, "0");
  // rgb(r,g,b)
  const m = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, "0")).join("");
  return fallback;
}

export async function exportToPptx(
  title: string,
  slides: Array<{ canvasJson: string; order: number }>,
  slideWidth = 1920,
  slideHeight = 1080
) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = title;

  const W = px(slideWidth);
  const H = px(slideHeight);
  pptx.defineLayout({ name: "CUSTOM", width: W, height: H });
  pptx.layout = "CUSTOM";

  const sorted = [...slides].sort((a, b) => a.order - b.order);

  for (const slideData of sorted) {
    const slide = pptx.addSlide();
    let parsed: { objects?: FabricObj[]; background?: string } = {};
    try { parsed = JSON.parse(slideData.canvasJson); } catch { /* skip */ }

    // Background
    if (parsed.background && parsed.background !== "transparent") {
      slide.background = { color: hexColor(parsed.background, "FFFFFF") };
    }

    for (const obj of parsed.objects ?? []) {
      const x = px(obj.left ?? 0);
      const y = px(obj.top ?? 0);
      const w = px((obj.width ?? 100) * (obj.scaleX ?? 1));
      const h = px((obj.height ?? 100) * (obj.scaleY ?? 1));
      const rotate = obj.angle ?? 0;
      const opacity = (obj.opacity ?? 1) * 100;

      try {
        switch (obj.type?.toLowerCase()) {
          case "rect":
            slide.addShape(pptx.ShapeType.rect, {
              x, y, w, h, rotate,
              fill: { color: hexColor(obj.fill as string), transparency: 100 - opacity },
              line: obj.stroke ? { color: hexColor(obj.stroke), width: obj.strokeWidth ?? 1 } : undefined,
              rectRadius: obj.rx ? px(obj.rx) : undefined,
            });
            break;

          case "circle": case "ellipse":
            slide.addShape(pptx.ShapeType.ellipse, {
              x: px(obj.left ?? 0) - px((obj.radius ?? 50) * (obj.scaleX ?? 1)),
              y: px(obj.top ?? 0) - px((obj.radius ?? 50) * (obj.scaleY ?? 1)),
              w: px((obj.radius ?? 50) * 2 * (obj.scaleX ?? 1)),
              h: px((obj.radius ?? 50) * 2 * (obj.scaleY ?? 1)),
              rotate,
              fill: { color: hexColor(obj.fill as string), transparency: 100 - opacity },
              line: obj.stroke ? { color: hexColor(obj.stroke), width: obj.strokeWidth ?? 1 } : undefined,
            });
            break;

          case "triangle":
            slide.addShape(pptx.ShapeType.triangle, {
              x, y, w, h, rotate,
              fill: { color: hexColor(obj.fill as string), transparency: 100 - opacity },
              line: obj.stroke ? { color: hexColor(obj.stroke), width: obj.strokeWidth ?? 1 } : undefined,
            });
            break;

          case "itext": case "textbox": case "text": {
            const align = obj.textAlign === "center" ? "center"
              : obj.textAlign === "right" ? "right" : "left";
            slide.addText(obj.text ?? "", {
              x, y, w, h, rotate,
              fontSize: px(obj.fontSize ?? 24) * 72,
              fontFace: obj.fontFamily ?? "Arial",
              color: hexColor(obj.fill as string, "000000"),
              bold: obj.fontWeight === "bold" || Number(obj.fontWeight) >= 700,
              italic: obj.fontStyle === "italic",
              underline: obj.underline ? { style: "sng" } : undefined,
              align,
              transparency: 100 - opacity,
            });
            break;
          }

          case "image": {
            if (obj.src) {
              slide.addImage({ data: obj.src, x, y, w, h, rotate, transparency: 100 - opacity });
            }
            break;
          }

          case "line": {
            // Lines need special handling — use rect as thin line
            const lw = px(obj.strokeWidth ?? 2);
            slide.addShape(pptx.ShapeType.rect, {
              x: px(Math.min(obj.x1 ?? 0, obj.x2 ?? 0) + (obj.left ?? 0)),
              y: px(Math.min(obj.y1 ?? 0, obj.y2 ?? 0) + (obj.top ?? 0)),
              w: px(Math.abs((obj.x2 ?? 0) - (obj.x1 ?? 0)) || 1),
              h: lw,
              fill: { color: hexColor(obj.stroke as string, "000000") },
            });
            break;
          }
        }
      } catch { /* skip unsupported object */ }
    }
  }

  await pptx.writeFile({ fileName: `${title}.pptx` });
}

export async function exportToPdf(
  title: string,
  canvasDataUrls: string[]
) {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();

  for (const dataUrl of canvasDataUrls) {
    const imgBytes = await fetch(dataUrl).then(r => r.arrayBuffer());
    const img = await doc.embedPng(imgBytes);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }

  const bytes = await doc.save();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${title}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

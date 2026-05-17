import { mutation } from "./_generated/server";

const BRAND_NAVY = "#0f172a";
const BRAND_GOLD = "#D4AF37";
const BRAND_SLATE = "#334155";
const BRAND_WHITE = "#ffffff";

function generateBlankSlide(bg: string = BRAND_WHITE) {
  return JSON.stringify({
    version: "6.0.0",
    objects: [],
    background: bg,
  });
}

function generateTextObj(text: string, top: number, left: number, fontSize: number, color: string, bold = false, align = "left", width = 800) {
  return {
    type: "i-text",
    left, top, width, text, fontSize,
    fontFamily: "Inter",
    fontWeight: bold ? "bold" : "normal",
    fill: color,
    textAlign: align,
  };
}

function generateRectObj(top: number, left: number, width: number, height: number, fill: string) {
  return {
    type: "rect",
    left, top, width, height,
    fill, rx: 8, ry: 8,
  };
}

// ── TEMPLATES ─────────────────────────────────────────────────────────────

function createPitchDeckSlides() {
  const slides = [];
  
  // 1. Cover
  slides.push(JSON.stringify({
    version: "6.0.0",
    background: BRAND_NAVY,
    objects: [
      generateRectObj(1080 - 150, 0, 1920, 150, BRAND_GOLD),
      generateTextObj("LUXURIOUS INVESTOR PITCH", 400, 150, 80, BRAND_WHITE, true),
      generateTextObj("Confidential & Proprietary", 520, 150, 36, BRAND_GOLD),
    ]
  }));

  // 2. Problem
  slides.push(JSON.stringify({
    version: "6.0.0",
    background: BRAND_WHITE,
    objects: [
      generateTextObj("THE PROBLEM", 100, 150, 60, BRAND_GOLD, true),
      generateRectObj(180, 150, 100, 8, BRAND_NAVY),
      generateTextObj("• Fragmented financial ecosystems\n• Poor user experiences in traditional banking\n• Lack of integrated wealth management", 300, 150, 40, BRAND_SLATE, false, "left", 1200),
    ]
  }));

  // 3. Solution
  slides.push(JSON.stringify({
    version: "6.0.0",
    background: BRAND_NAVY,
    objects: [
      generateTextObj("OUR SOLUTION", 100, 150, 60, BRAND_GOLD, true),
      generateRectObj(180, 150, 100, 8, BRAND_WHITE),
      generateTextObj("A unified, premium digital finance platform.", 300, 150, 48, BRAND_WHITE, false),
      generateRectObj(400, 150, 500, 300, BRAND_SLATE), // Placeholder image
      generateRectObj(400, 700, 500, 300, BRAND_SLATE),
    ]
  }));

  // Fill remaining 7 slides with basic structure
  for(let i = 0; i < 7; i++) {
    slides.push(JSON.stringify({
      version: "6.0.0",
      background: BRAND_WHITE,
      objects: [
        generateTextObj(`SLIDE ${i + 4} / 10`, 100, 150, 60, BRAND_GOLD, true),
        generateRectObj(180, 150, 100, 8, BRAND_NAVY),
        generateTextObj("Add content here...", 300, 150, 36, BRAND_SLATE),
      ]
    }));
  }
  return slides;
}

function createBusinessReportSlides() {
  const slides = [];
  // Cover
  slides.push(JSON.stringify({
    version: "6.0.0",
    background: BRAND_SLATE,
    objects: [
      generateTextObj("Q3 BUSINESS REPORT", 400, 150, 80, BRAND_WHITE, true),
      generateTextObj("Performance & Metrics", 520, 150, 40, BRAND_GOLD),
    ]
  }));
  // Add 7 more
  for(let i = 0; i < 7; i++) {
    slides.push(generateBlankSlide(BRAND_WHITE));
  }
  return slides;
}

function createProposalSlides() {
  const slides = [];
  slides.push(JSON.stringify({
    version: "6.0.0",
    background: BRAND_WHITE,
    objects: [
      generateRectObj(0, 0, 400, 1080, BRAND_NAVY),
      generateTextObj("PROJECT PROPOSAL", 400, 450, 80, BRAND_NAVY, true),
      generateTextObj("Prepared by Luxurious", 520, 450, 36, BRAND_GOLD),
    ]
  }));
  for(let i = 0; i < 6; i++) {
    slides.push(generateBlankSlide(BRAND_WHITE));
  }
  return slides;
}

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Pitch Deck
    await ctx.db.insert("presentationTemplates", {
      name: "Standard Pitch Deck",
      category: "pitch-deck",
      isSystem: true,
      slideWidth: 1920,
      slideHeight: 1080,
      slides: createPitchDeckSlides().map((json, i) => ({ id: crypto.randomUUID(), canvasJson: json, order: i }))
    });

    // 2. Business Report
    await ctx.db.insert("presentationTemplates", {
      name: "Quarterly Report",
      category: "report",
      isSystem: true,
      slideWidth: 1920,
      slideHeight: 1080,
      slides: createBusinessReportSlides().map((json, i) => ({ id: crypto.randomUUID(), canvasJson: json, order: i }))
    });

    // 3. Project Proposal
    await ctx.db.insert("presentationTemplates", {
      name: "Client Proposal",
      category: "proposal",
      isSystem: true,
      slideWidth: 1920,
      slideHeight: 1080,
      slides: createProposalSlides().map((json, i) => ({ id: crypto.randomUUID(), canvasJson: json, order: i }))
    });

    return "Seeded templates successfully!";
  }
});

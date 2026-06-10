// node docs/generate-pptx.js
const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const sourceArg = process.argv[2] || 'docs/dojo-signals-slides-short.md';
const outputArg = process.argv[3] || 'docs/dojo-signals.pptx';
const SOURCE = path.resolve(ROOT, sourceArg);
const OUTPUT = path.resolve(ROOT, outputArg);

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Dojo Angular Signals';
pptx.subject = 'Angular 21 Signals';
pptx.title = 'Angular 21 Signals - Support de presentation dojo';
pptx.company = 'Dojo Angular';
pptx.lang = 'fr-FR';

const W = 13.333;
const H = 7.5;
const M = 0.45;
const CONTENT_W = W - M * 2;
const HEADER_H = 0.72;

const COLORS = {
  primary: 'DD0031',
  secondary: '1976D2',
  dark: '202124',
  text: '333333',
  muted: '5F6368',
  light: 'F6F7F9',
  line: 'DADCE0',
  code: '1F2937',
  codeText: 'F8FAFC',
  quote: 'FFF3CD',
  quoteBorder: 'FFC107',
  white: 'FFFFFF',
};

function cleanInline(text) {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim();
}

function isTableLine(line) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cleanInline(cell));
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  let current = null;
  let currentH2 = '';
  let inCode = false;
  let codeLang = '';
  let codeLines = [];

  function startSection(level, title) {
    if (current) sections.push(current);
    if (level === 2) currentH2 = title;
    const displayTitle = level === 3 && currentH2 ? `${currentH2} — ${title}` : title;
    current = { level, title: displayTitle, rawTitle: title, items: [] };
  }

  function pushParagraph(buffer) {
    const text = cleanInline(buffer.join(' '));
    if (text) current.items.push({ type: 'paragraph', text });
  }

  let paragraph = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (inCode) {
      if (/^```/.test(line)) {
        current.items.push({ type: 'code', lang: codeLang, text: codeLines.join('\n') });
        inCode = false;
        codeLang = '';
        codeLines = [];
      } else {
        codeLines.push(line);
      }
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      if (paragraph.length) {
        pushParagraph(paragraph);
        paragraph = [];
      }
      startSection(heading[1].length, cleanInline(heading[2]));
      continue;
    }

    if (!current) continue;
    if (/^---\s*$/.test(line)) {
      if (paragraph.length) {
        pushParagraph(paragraph);
        paragraph = [];
      }
      continue;
    }

    if (/^```/.test(line)) {
      if (paragraph.length) {
        pushParagraph(paragraph);
        paragraph = [];
      }
      inCode = true;
      codeLang = line.replace(/^```/, '').trim();
      codeLines = [];
      continue;
    }

    if (isTableLine(line)) {
      if (paragraph.length) {
        pushParagraph(paragraph);
        paragraph = [];
      }
      const rows = [];
      while (i < lines.length && isTableLine(lines[i])) {
        if (!isTableSeparator(lines[i])) rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      i -= 1;
      if (rows.length) current.items.push({ type: 'table', rows });
      continue;
    }

    const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      if (paragraph.length) {
        pushParagraph(paragraph);
        paragraph = [];
      }
      current.items.push({ type: 'bullet', text: cleanInline(bullet[1]) });
      continue;
    }

    const quote = /^\s*>\s?(.+)$/.exec(line);
    if (quote) {
      if (paragraph.length) {
        pushParagraph(paragraph);
        paragraph = [];
      }
      current.items.push({ type: 'quote', text: cleanInline(quote[1]) });
      continue;
    }

    if (!line.trim()) {
      if (paragraph.length) {
        pushParagraph(paragraph);
        paragraph = [];
      }
      continue;
    }

    paragraph.push(line);
  }

  if (paragraph.length) pushParagraph(paragraph);
  if (current) sections.push(current);
  return sections;
}

function addFooter(slide, index, total) {
  slide.addText(`${index}/${total}`, {
    x: W - 1.0,
    y: H - 0.35,
    w: 0.55,
    h: 0.2,
    fontSize: 7,
    color: COLORS.muted,
    align: 'right',
  });
}

function addHeader(slide, title, accent = COLORS.primary) {
  slide.background = { color: COLORS.white };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: W,
    h: HEADER_H,
    fill: { color: accent },
    line: { color: accent },
  });
  slide.addText(title, {
    x: M,
    y: 0.12,
    w: CONTENT_W,
    h: 0.45,
    fontSize: title.length > 80 ? 15 : 18,
    bold: true,
    color: COLORS.white,
    fit: 'shrink',
    margin: 0,
  });
}

function coverSlide(title) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.primary };
  slide.addText(title, {
    x: 0.65,
    y: 1.65,
    w: W - 1.3,
    h: 1.4,
    fontSize: 44,
    bold: true,
    color: COLORS.white,
    align: 'center',
    valign: 'mid',
    fit: 'shrink',
  });
  slide.addText('Support de présentation dojo', {
    x: 0.65,
    y: 3.35,
    w: W - 1.3,
    h: 0.45,
    fontSize: 22,
    color: 'FFD5DC',
    align: 'center',
  });
  slide.addText('Angular 21 · Signals · Zone.js · RxJS interop', {
    x: 0.65,
    y: 5.35,
    w: W - 1.3,
    h: 0.35,
    fontSize: 13,
    color: 'FFD5DC',
    align: 'center',
  });
  return slide;
}

function sectionSlide(title) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.secondary };
  const [prefix, rest] = title.split(' — ');
  if (rest) {
    slide.addText(prefix, {
      x: 0.65,
      y: 1.75,
      w: W - 1.3,
      h: 0.45,
      fontSize: 18,
      color: 'CFE8FF',
      align: 'center',
      margin: 0,
    });
    slide.addText(rest, {
      x: 0.65,
      y: 2.35,
      w: W - 1.3,
      h: 1.2,
      fontSize: 38,
      bold: true,
      color: COLORS.white,
      align: 'center',
      valign: 'mid',
      fit: 'shrink',
      margin: 0,
    });
  } else {
    slide.addText(title, {
      x: 0.65,
      y: 2.2,
      w: W - 1.3,
      h: 1.2,
      fontSize: 38,
      bold: true,
      color: COLORS.white,
      align: 'center',
      valign: 'mid',
      fit: 'shrink',
      margin: 0,
    });
  }
  return slide;
}

function newContentSlide(title, part) {
  const slide = pptx.addSlide();
  addHeader(slide, part ? `${title} (${part})` : title);
  return { slide, y: 1.02 };
}

function estimateTextHeight(text, charsPerLine, lineHeight, minHeight = 0.28) {
  const lines = text.split('\n').reduce((count, line) => count + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
  return Math.max(minHeight, lines * lineHeight + 0.05);
}

function renderParagraph(slide, item, y) {
  const h = estimateTextHeight(item.text, 115, 0.21, 0.35);
  slide.addText(item.text, {
    x: M,
    y,
    w: CONTENT_W,
    h,
    fontSize: 12.2,
    color: COLORS.text,
    fit: 'shrink',
    valign: 'top',
    margin: 0.02,
    breakLine: false,
  });
  return h + 0.12;
}

function renderBullet(slide, item, y) {
  const h = estimateTextHeight(item.text, 105, 0.2, 0.28);
  slide.addText(item.text, {
    x: M + 0.18,
    y,
    w: CONTENT_W - 0.18,
    h,
    fontSize: 11.6,
    color: COLORS.text,
    bullet: { type: 'bullet' },
    fit: 'shrink',
    margin: 0.01,
  });
  return h + 0.06;
}

function renderQuote(slide, item, y) {
  const h = estimateTextHeight(item.text, 95, 0.21, 0.42);
  slide.addText(item.text, {
    x: M,
    y,
    w: CONTENT_W,
    h,
    fontSize: 11.5,
    color: COLORS.text,
    italic: true,
    fill: { color: COLORS.quote },
    line: { color: COLORS.quoteBorder, pt: 1 },
    fit: 'shrink',
    margin: 0.08,
  });
  return h + 0.14;
}

function renderCode(slide, item, y) {
  const lines = item.text.split('\n');
  const h = Math.min(5.9, Math.max(0.55, lines.length * 0.17 + 0.18));
  slide.addText(item.text, {
    x: M,
    y,
    w: CONTENT_W,
    h,
    fontFace: 'Courier New',
    fontSize: lines.length > 18 ? 7.5 : 8.8,
    color: COLORS.codeText,
    fill: { color: COLORS.code },
    fit: 'shrink',
    valign: 'top',
    margin: 0.08,
    breakLine: false,
  });
  return h + 0.16;
}

function renderTable(slide, item, y) {
  const maxCols = Math.max(...item.rows.map((row) => row.length));
  const normalizedRows = item.rows.map((row) => {
    const cells = [...row];
    while (cells.length < maxCols) cells.push('');
    return cells;
  });
  const rows = normalizedRows.map((row, rowIndex) =>
    row.map((cell) => ({
      text: cell,
      options: {
        fontSize: maxCols > 3 ? 8.5 : 10.2,
        bold: rowIndex === 0,
        color: rowIndex === 0 ? COLORS.white : COLORS.text,
        fill: { color: rowIndex === 0 ? COLORS.primary : rowIndex % 2 ? COLORS.white : COLORS.light },
        valign: 'mid',
        margin: [2, 4, 2, 4],
      },
    })),
  );
  const h = Math.min(5.9, Math.max(0.65, normalizedRows.length * 0.34));
  const colW = Array(maxCols).fill(CONTENT_W / maxCols);
  slide.addTable(rows, {
    x: M,
    y,
    w: CONTENT_W,
    h,
    colW,
    rowH: 0.34,
    border: { pt: 0.45, color: COLORS.line },
    fit: 'shrink',
  });
  return h + 0.18;
}

function itemHeight(item) {
  if (item.type === 'paragraph') return estimateTextHeight(item.text, 115, 0.21, 0.35) + 0.12;
  if (item.type === 'bullet') return estimateTextHeight(item.text, 105, 0.2, 0.28) + 0.06;
  if (item.type === 'quote') return estimateTextHeight(item.text, 95, 0.21, 0.42) + 0.14;
  if (item.type === 'code') return Math.min(5.9, Math.max(0.55, item.text.split('\n').length * 0.17 + 0.18)) + 0.16;
  if (item.type === 'table') return Math.min(5.9, Math.max(0.65, item.rows.length * 0.34)) + 0.18;
  return 0.3;
}

function splitLargeCode(item) {
  if (item.type !== 'code') return [item];
  const lines = item.text.split('\n');
  if (lines.length <= 24) return [item];
  const chunks = [];
  for (let i = 0; i < lines.length; i += 22) {
    chunks.push({ ...item, text: lines.slice(i, i + 22).join('\n') });
  }
  return chunks;
}

function isInstructionParagraph(section, item) {
  if (item.type !== 'paragraph') return false;
  const title = `${section.rawTitle} ${section.title}`.toLowerCase();
  const text = item.text;
  return (
    /consigne|fichier/.test(title) ||
    /^npm\s+/.test(text) ||
    /(^|[\s`])src\/.+\.(ts|html|scss|spec\.ts)\b/.test(text) ||
    /\.(component|facade|service|spec)\.(ts|html|scss)\b/.test(text)
  );
}

function isPresenterMessage(section, item) {
  if (item.type === 'quote') return true;
  if (item.type === 'paragraph') return !isInstructionParagraph(section, item);
  return false;
}

function itemToNotes(item) {
  if (item.type === 'quote' || item.type === 'paragraph') return item.text;
  return '';
}

function renderItem(slide, item, y) {
  if (item.type === 'paragraph') return renderParagraph(slide, item, y);
  if (item.type === 'bullet') return renderBullet(slide, item, y);
  if (item.type === 'quote') return renderQuote(slide, item, y);
  if (item.type === 'code') return renderCode(slide, item, y);
  if (item.type === 'table') return renderTable(slide, item, y);
  return 0;
}

function renderSection(section) {
  if (section.level === 1) {
    coverSlide(section.title);
    return;
  }

  if (section.level === 2 && /^Exercice\s+\d+/.test(section.title)) {
    sectionSlide(section.title);
    return;
  }

  const allItems = section.items.flatMap(splitLargeCode);
  const notes = allItems
    .filter((item) => isPresenterMessage(section, item))
    .map(itemToNotes)
    .filter(Boolean)
    .join('\n\n');
  const items = allItems.filter((item) => !isPresenterMessage(section, item));
  if (!items.length) {
    const slide = sectionSlide(section.title);
    if (notes) slide.addNotes(notes);
    return;
  }

  let slideNo = 1;
  let state = newContentSlide(section.title, null);
  if (notes) state.slide.addNotes(notes);
  for (const item of items) {
    const h = itemHeight(item);
    if (state.y + h > H - 0.55) {
      slideNo += 1;
      state = newContentSlide(section.title, `suite ${slideNo}`);
    }
    state.y += renderItem(state.slide, item, state.y);
  }
}

const markdown = fs.readFileSync(SOURCE, 'utf8');
const sections = parseMarkdown(markdown);
sections.forEach(renderSection);

const total = pptx._slides.length;
pptx._slides.forEach((slide, index) => addFooter(slide, index + 1, total));

pptx.writeFile({ fileName: OUTPUT })
  .then(() => {
    const relative = path.relative(ROOT, OUTPUT).replace(/\\/g, '/');
    const sourceRelative = path.relative(ROOT, SOURCE).replace(/\\/g, '/');
    console.log(`PPTX généré : ${relative}`);
    console.log(`${total} slides créées depuis ${sourceRelative}`);
  })
  .catch((err) => {
    console.error('Erreur de génération PPTX :', err);
    process.exitCode = 1;
  });

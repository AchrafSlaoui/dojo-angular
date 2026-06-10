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
  text: '273043',
  muted: '667085',
  light: 'F7F9FC',
  line: 'E4E7EC',
  code: '1F2937',
  codeText: 'F8FAFC',
  quote: 'FFF3CD',
  quoteBorder: 'FFC107',
  surface: 'FFFFFF',
  softRed: 'FCE7EC',
  softBlue: 'E8F1FF',
  softGreen: 'EAF7F0',
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
  slide.background = { color: COLORS.light };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: W,
    h: 0.1,
    fill: { color: accent },
    line: { color: accent },
  });
  slide.addText(title, {
    x: M,
    y: 0.24,
    w: CONTENT_W - 2.2,
    h: 0.38,
    fontSize: title.length > 80 ? 16 : 20,
    bold: true,
    color: COLORS.dark,
    fit: 'shrink',
    margin: 0,
  });
  slide.addText('Angular Signals', {
    x: W - 2.05,
    y: 0.27,
    w: 1.6,
    h: 0.24,
    fontSize: 8,
    bold: true,
    color: accent,
    align: 'center',
    valign: 'mid',
    fill: { color: COLORS.softRed },
    line: { color: COLORS.softRed },
    margin: 0.02,
  });
}

function coverSlide(title) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.light };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 3.25,
    h: H,
    fill: { color: COLORS.primary },
    line: { color: COLORS.primary },
  });
  slide.addText('Dojo', {
    x: 0.55,
    y: 0.55,
    w: 2.1,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: COLORS.white,
    margin: 0,
  });
  slide.addText(title, {
    x: 3.85,
    y: 1.55,
    w: W - 4.45,
    h: 1.25,
    fontSize: 38,
    bold: true,
    color: COLORS.dark,
    align: 'left',
    valign: 'mid',
    fit: 'shrink',
    margin: 0,
  });
  slide.addText('Support de présentation dojo', {
    x: 3.9,
    y: 3.05,
    w: W - 4.5,
    h: 0.42,
    fontSize: 18,
    color: COLORS.muted,
    align: 'left',
    margin: 0,
  });
  slide.addText('Angular 21 · Signals · Zone.js · RxJS interop', {
    x: 3.9,
    y: 4.55,
    w: 4.5,
    h: 0.34,
    fontSize: 11,
    color: COLORS.primary,
    bold: true,
    align: 'center',
    valign: 'mid',
    fill: { color: COLORS.softRed },
    line: { color: COLORS.softRed },
    margin: 0.02,
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
  const rowCount = normalizedRows.length;
  const denseTable = rowCount > 6;
  const fontSize = maxCols > 3 ? 7.8 : denseTable ? 7.4 : 10.2;
  const rows = normalizedRows.map((row, rowIndex) =>
    row.map((cell) => ({
      text: cell,
      options: {
        fontSize,
        bold: rowIndex === 0,
        color: rowIndex === 0 ? COLORS.white : COLORS.text,
        fill: { color: rowIndex === 0 ? COLORS.primary : rowIndex % 2 ? COLORS.white : COLORS.light },
        valign: 'mid',
        margin: [2, 4, 2, 4],
      },
    })),
  );
  const h = Math.min(H - y - 0.45, Math.max(0.65, rowCount * (denseTable ? 0.58 : 0.34)));
  const rowH = h / rowCount;
  const colW = maxCols === 3
    ? [1.55, 3.1, CONTENT_W - 4.65]
    : maxCols === 4
      ? [0.75, 2.45, 2.85, CONTENT_W - 6.05]
      : Array(maxCols).fill(CONTENT_W / maxCols);
  slide.addTable(rows, {
    x: M,
    y,
    w: CONTENT_W,
    h,
    colW,
    rowH,
    border: { pt: 0.45, color: COLORS.line },
    fit: 'shrink',
  });
  return h + 0.18;
}

function shortenExerciseFiles(text) {
  return text
    .replace(/src\/app\/features\//g, '')
    .replace(/, /g, '\n');
}

function renderExerciseCard(slide, row, index) {
  const [exercise, files, definition, need] = row;
  const col = index < 4 ? 0 : 1;
  const rowIndex = index % 4;
  const gapX = 0.24;
  const gapY = 0.11;
  const cardW = (CONTENT_W - gapX) / 2;
  const cardH = 1.28;
  const x = M + col * (cardW + gapX);
  const y = 1.02 + rowIndex * (cardH + gapY);
  const palette = index % 2 === 0
    ? { fill: COLORS.white, accent: COLORS.primary, chip: COLORS.softRed }
    : { fill: COLORS.white, accent: COLORS.secondary, chip: COLORS.softBlue };

  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: cardW,
    h: cardH,
    rectRadius: 0.06,
    fill: { color: palette.fill },
    line: { color: COLORS.line, pt: 0.8 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.08,
    h: cardH,
    fill: { color: palette.accent },
    line: { color: palette.accent },
  });
  slide.addText(exercise, {
    x: x + 0.18,
    y: y + 0.12,
    w: 1.55,
    h: 0.2,
    fontSize: 8.2,
    bold: true,
    color: palette.accent,
    margin: 0,
    fit: 'shrink',
  });
  slide.addText(definition, {
    x: x + 1.78,
    y: y + 0.12,
    w: cardW - 1.95,
    h: 0.2,
    fontSize: 6.8,
    color: COLORS.muted,
    margin: 0,
    fit: 'shrink',
  });
  slide.addText(shortenExerciseFiles(files), {
    x: x + 0.18,
    y: y + 0.4,
    w: 2.05,
    h: 0.56,
    fontSize: 5.8,
    color: COLORS.secondary,
    margin: 0,
    breakLine: false,
    fit: 'shrink',
    valign: 'top',
  });
  slide.addText(need, {
    x: x + 2.34,
    y: y + 0.39,
    w: cardW - 2.52,
    h: 0.72,
    fontSize: 6.8,
    color: COLORS.text,
    margin: 0.02,
    fit: 'shrink',
    valign: 'top',
  });
}

function renderExercisesSection(section) {
  const table = section.items.find((item) => item.type === 'table');
  if (!table || table.rows.length <= 1) return false;

  const slide = pptx.addSlide();
  addHeader(slide, section.title);
  const exerciseRows = table.rows.slice(1);
  exerciseRows.forEach((row, index) => renderExerciseCard(slide, row, index));

  const note = section.items
    .filter((item) => item.type === 'paragraph')
    .map((item) => item.text)
    .join(' ');
  if (note) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: M,
      y: 6.55,
      w: CONTENT_W,
      h: 0.42,
      rectRadius: 0.06,
      fill: { color: COLORS.softGreen },
      line: { color: 'B7E4C7', pt: 0.8 },
    });
    slide.addText(note, {
      x: M + 0.18,
      y: 6.65,
      w: CONTENT_W - 0.36,
      h: 0.19,
      fontSize: 7.8,
      bold: true,
      color: COLORS.text,
      align: 'center',
      margin: 0,
      fit: 'shrink',
    });
  }
  return true;
}

function renderRecapSection(section) {
  const paragraph = section.items.find((item) => item.type === 'paragraph');
  const bullets = section.items.filter((item) => item.type === 'bullet');
  if (!paragraph || !bullets.length) return false;

  const slide = pptx.addSlide();
  addHeader(slide, section.title);
  const subject = section.rawTitle.replace(/^Rappels\s+—\s+/, '');
  const palette = subject.includes('Zone')
    ? { accent: COLORS.secondary, soft: COLORS.softBlue }
    : subject.includes('RxJS')
      ? { accent: '188038', soft: COLORS.softGreen }
      : { accent: COLORS.primary, soft: COLORS.softRed };

  slide.addShape(pptx.ShapeType.roundRect, {
    x: M,
    y: 1.05,
    w: 4.15,
    h: 5.7,
    rectRadius: 0.08,
    fill: { color: palette.soft },
    line: { color: palette.soft, pt: 0.8 },
  });
  slide.addText(subject, {
    x: M + 0.32,
    y: 1.35,
    w: 3.45,
    h: 0.5,
    fontSize: 26,
    bold: true,
    color: palette.accent,
    margin: 0,
    fit: 'shrink',
  });
  slide.addText('Définition', {
    x: M + 0.32,
    y: 1.98,
    w: 1.35,
    h: 0.2,
    fontSize: 8,
    bold: true,
    color: palette.accent,
    margin: 0,
  });
  slide.addText(paragraph.text, {
    x: M + 0.32,
    y: 2.3,
    w: 3.42,
    h: 2.15,
    fontSize: 16,
    bold: true,
    color: COLORS.dark,
    margin: 0.03,
    fit: 'shrink',
    valign: 'mid',
  });
  slide.addText('Question cle', {
    x: M + 0.32,
    y: 5.25,
    w: 1.3,
    h: 0.2,
    fontSize: 8,
    bold: true,
    color: palette.accent,
    margin: 0,
  });
  slide.addText(subject.includes('Zone')
    ? 'Qui declenche la detection ?'
    : subject.includes('RxJS')
      ? 'Ou placer la frontiere avec Signals ?'
      : 'Qui depend de cette valeur ?',
  {
    x: M + 0.32,
    y: 5.55,
    w: 3.4,
    h: 0.42,
    fontSize: 12,
    color: COLORS.text,
    margin: 0,
    fit: 'shrink',
  });

  const blocks = [
    { title: 'Rôle', items: bullets.slice(0, 2), y: 1.05 },
    { title: 'À retenir', items: bullets.slice(2, 4), y: 3.92 },
  ];
  blocks.forEach((block) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: M + 4.55,
      y: block.y,
      w: CONTENT_W - 4.55,
      h: 2.55,
      rectRadius: 0.08,
      fill: { color: COLORS.white },
      line: { color: COLORS.line, pt: 0.8 },
    });
    slide.addText(block.title, {
      x: M + 4.85,
      y: block.y + 0.22,
      w: 3.2,
      h: 0.28,
      fontSize: 13,
      bold: true,
      color: palette.accent,
      margin: 0,
    });
    block.items.forEach((item, index) => {
      slide.addShape(pptx.ShapeType.ellipse, {
        x: M + 4.88,
        y: block.y + 0.77 + index * 0.72,
        w: 0.12,
        h: 0.12,
        fill: { color: palette.accent },
        line: { color: palette.accent },
      });
      slide.addText(item.text, {
        x: M + 5.15,
        y: block.y + 0.66 + index * 0.72,
        w: CONTENT_W - 5.45,
        h: 0.48,
        fontSize: 12.5,
        color: COLORS.text,
        margin: 0,
        fit: 'shrink',
      });
    });
  });
  return true;
}

function renderTestsSection(section) {
  const bullets = section.items.filter((item) => item.type === 'bullet');
  const code = section.items.find((item) => item.type === 'code');
  if (!bullets.length) return false;

  const slide = pptx.addSlide();
  addHeader(slide, section.title, '188038');
  slide.addShape(pptx.ShapeType.roundRect, {
    x: M,
    y: 1.08,
    w: 4.35,
    h: 5.55,
    rectRadius: 0.08,
    fill: { color: COLORS.softGreen },
    line: { color: 'B7E4C7', pt: 0.8 },
  });
  slide.addText('À lancer', {
    x: M + 0.35,
    y: 1.42,
    w: 1.2,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: '188038',
    margin: 0,
  });
  slide.addText(code ? code.text : 'npm test', {
    x: M + 0.35,
    y: 2.02,
    w: 3.55,
    h: 0.72,
    fontFace: 'Courier New',
    fontSize: 20,
    bold: true,
    color: COLORS.codeText,
    fill: { color: COLORS.code },
    margin: 0.1,
    fit: 'shrink',
  });
  slide.addText('But : verifier que la migration ne casse pas le comportement existant.', {
    x: M + 0.35,
    y: 3.35,
    w: 3.55,
    h: 1.25,
    fontSize: 16,
    bold: true,
    color: COLORS.dark,
    margin: 0,
    fit: 'shrink',
  });

  const rules = bullets.slice(0, 4);
  rules.forEach((item, index) => {
    const y = 1.08 + index * 1.36;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: M + 4.75,
      y,
      w: CONTENT_W - 4.75,
      h: 1.12,
      rectRadius: 0.08,
      fill: { color: COLORS.white },
      line: { color: COLORS.line, pt: 0.8 },
    });
    slide.addText(String(index + 1), {
      x: M + 5.02,
      y: y + 0.28,
      w: 0.3,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: '188038',
      align: 'center',
      valign: 'mid',
      fill: { color: COLORS.softGreen },
      line: { color: COLORS.softGreen },
      margin: 0,
    });
    slide.addText(item.text, {
      x: M + 5.52,
      y: y + 0.22,
      w: CONTENT_W - 5.85,
      h: 0.58,
      fontSize: 12,
      color: COLORS.text,
      margin: 0,
      fit: 'shrink',
      valign: 'mid',
    });
  });
  return true;
}

function itemHeight(item) {
  if (item.type === 'paragraph') return estimateTextHeight(item.text, 115, 0.21, 0.35) + 0.12;
  if (item.type === 'bullet') return estimateTextHeight(item.text, 105, 0.2, 0.28) + 0.06;
  if (item.type === 'quote') return estimateTextHeight(item.text, 95, 0.21, 0.42) + 0.14;
  if (item.type === 'code') return Math.min(5.9, Math.max(0.55, item.text.split('\n').length * 0.17 + 0.18)) + 0.16;
  if (item.type === 'table') {
    const denseTable = item.rows.length > 6;
    return Math.min(5.9, Math.max(0.65, item.rows.length * (denseTable ? 0.58 : 0.34))) + 0.18;
  }
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

  if (section.level === 2 && /^Rappels\s+—/.test(section.rawTitle) && renderRecapSection(section)) {
    return;
  }

  if (section.level === 2 && section.rawTitle === 'Exercices' && renderExercisesSection(section)) {
    return;
  }

  if (section.level === 2 && section.rawTitle === 'Rappel tests' && renderTestsSection(section)) {
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

/**
 * String-based XML operations for RC0 non-standard XML format.
 *
 * RC0 files use numeric tag names (<0>, <1>), special character tags (<#>),
 * and content outside the root element (<count>). Standard XML parsers cannot
 * handle these, so we use string find-and-replace.
 */

export interface TextEdit {
  start: number;
  end: number;
  value: string;
}

/**
 * Find the content boundaries of an element within the template string.
 * Returns [contentStart, contentEnd] or null if not found.
 * Handles elements with attributes (e.g., <mem id="0">).
 */
export function findSection(xml: string, tagName: string, from: number = 0, to?: number): [number, number] | null {
  const limit = to ?? xml.length;

  const exactOpen = `<${tagName}>`;
  const attrOpen = `<${tagName} `;

  const exactIdx = xml.indexOf(exactOpen, from);
  const attrIdx = xml.indexOf(attrOpen, from);

  const exactValid = exactIdx !== -1 && exactIdx < limit;
  const attrValid = attrIdx !== -1 && attrIdx < limit;

  let contentStart: number;

  if (exactValid && (!attrValid || exactIdx <= attrIdx)) {
    contentStart = exactIdx + exactOpen.length;
  } else if (attrValid) {
    const closeAngle = xml.indexOf('>', attrIdx + attrOpen.length);
    if (closeAngle === -1 || closeAngle >= limit) return null;
    contentStart = closeAngle + 1;
  } else {
    return null;
  }

  const closeTag = `</${tagName}>`;
  const contentEnd = xml.indexOf(closeTag, contentStart);
  if (contentEnd === -1 || contentEnd >= limit) return null;

  return [contentStart, contentEnd];
}

/**
 * Queue an edit to replace the text content of <tag>value</tag> within a range.
 */
export function queueEdit(edits: TextEdit[], xml: string, tagName: string, value: string | number, from: number, to: number): void {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;

  const tagStart = xml.indexOf(openTag, from);
  if (tagStart === -1 || tagStart >= to) return;

  const contentStart = tagStart + openTag.length;
  const contentEnd = xml.indexOf(closeTag, contentStart);
  if (contentEnd === -1 || contentEnd > to) return;

  edits.push({ start: contentStart, end: contentEnd, value: String(value) });
}

/**
 * Apply all collected edits to the template string.
 * Edits are applied from end to start so earlier indices remain valid.
 */
export function applyEdits(xml: string, edits: TextEdit[]): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let result = xml;
  for (const edit of sorted) {
    result = result.substring(0, edit.start) + edit.value + result.substring(edit.end);
  }
  return result;
}

/**
 * Extract the text content of a single tag within a range.
 */
export function getTagContent(xml: string, tagName: string, from: number, to: number): string | null {
  const open = `<${tagName}>`;
  const close = `</${tagName}>`;
  const start = xml.indexOf(open, from);
  if (start === -1 || start >= to) return null;
  const contentStart = start + open.length;
  const end = xml.indexOf(close, contentStart);
  if (end === -1 || end > to) return null;
  return xml.substring(contentStart, end);
}

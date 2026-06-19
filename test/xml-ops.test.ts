import { describe, it, expect } from 'vitest';
import { findSection, queueEdit, applyEdits, getTagContent } from '../src/generator/xml-ops.js';
import type { TextEdit } from '../src/generator/xml-ops.js';

describe('findSection', () => {
  it('finds a simple tag', () => {
    const xml = '<root><A>hello</A></root>';
    const result = findSection(xml, 'A');
    expect(result).not.toBeNull();
    expect(xml.substring(result![0], result![1])).toBe('hello');
  });

  it('finds a tag with attributes', () => {
    const xml = '<root><mem id="0">content</mem></root>';
    const result = findSection(xml, 'mem');
    expect(result).not.toBeNull();
    expect(xml.substring(result![0], result![1])).toBe('content');
  });

  it('returns null for missing tag', () => {
    expect(findSection('<root></root>', 'missing')).toBeNull();
  });

  it('respects from/to boundaries', () => {
    const xml = '<A>first</A><B><A>second</A></B>';
    const bSection = findSection(xml, 'B');
    expect(bSection).not.toBeNull();
    const inner = findSection(xml, 'A', bSection![0], bSection![1]);
    expect(inner).not.toBeNull();
    expect(xml.substring(inner![0], inner![1])).toBe('second');
  });

  it('returns null when tag is outside boundary', () => {
    const xml = '<A>first</A><B>second</B>';
    const result = findSection(xml, 'B', 0, 15);
    expect(result).toBeNull();
  });
});

describe('getTagContent', () => {
  it('extracts tag content within range', () => {
    const xml = '<root><A>42</A><B>99</B></root>';
    const root = findSection(xml, 'root')!;
    expect(getTagContent(xml, 'A', root[0], root[1])).toBe('42');
    expect(getTagContent(xml, 'B', root[0], root[1])).toBe('99');
  });

  it('returns null for missing tag', () => {
    const xml = '<root><A>42</A></root>';
    const root = findSection(xml, 'root')!;
    expect(getTagContent(xml, 'Z', root[0], root[1])).toBeNull();
  });
});

describe('queueEdit + applyEdits', () => {
  it('replaces tag content', () => {
    const xml = '<root><A>0</A><B>0</B></root>';
    const edits: TextEdit[] = [];
    const root = findSection(xml, 'root')!;
    queueEdit(edits, xml, 'A', 42, root[0], root[1]);
    queueEdit(edits, xml, 'B', 'hello', root[0], root[1]);
    const result = applyEdits(xml, edits);
    expect(result).toBe('<root><A>42</A><B>hello</B></root>');
  });

  it('handles multiple edits applied in reverse order', () => {
    const xml = '<X><A>0</A><B>0</B><C>0</C></X>';
    const edits: TextEdit[] = [];
    const x = findSection(xml, 'X')!;
    queueEdit(edits, xml, 'A', 1, x[0], x[1]);
    queueEdit(edits, xml, 'B', 2, x[0], x[1]);
    queueEdit(edits, xml, 'C', 3, x[0], x[1]);
    const result = applyEdits(xml, edits);
    expect(result).toBe('<X><A>1</A><B>2</B><C>3</C></X>');
  });

  it('skips tags outside the range', () => {
    const xml = '<A>keep</A><inner><A>change</A></inner>';
    const edits: TextEdit[] = [];
    const inner = findSection(xml, 'inner')!;
    queueEdit(edits, xml, 'A', 'new', inner[0], inner[1]);
    const result = applyEdits(xml, edits);
    expect(result).toBe('<A>keep</A><inner><A>new</A></inner>');
  });
});

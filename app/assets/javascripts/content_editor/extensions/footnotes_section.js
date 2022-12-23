import { mergeAttributes, Node } from '@tiptap/core';

export default Node.create({
  name: 'footnotesSection',

  content: 'footnoteDefinition+',

  group: 'block',

  isolating: true,

  parseHTML() {
    return [
      { tag: 'section.footnotes', skip: true },
      { tag: 'section.footnotes > ol', skip: true },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['ol', mergeAttributes(HTMLAttributes, { class: 'footnotes gl-font-sm' }), 0];
  },
});

const { GeometryEngine } = require('./geometry-engine.js');
const { TemplateRenderer, TERMINAL_TEMPLATE, COLOR_PALETTE } = require('./template-system.js');

class SymbolRendererV2 {
  constructor(circuitSpec) {
    this.geometry = new GeometryEngine(circuitSpec);
    this.spec = circuitSpec;
    this.templateRenderer = new TemplateRenderer();
    this.colors = COLOR_PALETTE;
    this.terminalCfg = TERMINAL_TEMPLATE.geometry;
  }

  renderPart(view, componentId, partId, state = {}) {
    const terminals = this.getTerminalsForPart(view, componentId, partId);
    const part = this.spec.components[componentId]?.parts[partId];
    if (!part || terminals.length === 0) return '';

    return [
      this.renderTerminals(terminals),
      this.renderSymbol(view, componentId, partId, terminals, state),
      this.renderLabels(view, componentId, partId, terminals)
    ].join('');
  }

  renderTerminals(terminals) {
    return terminals.map(t => 
      `<circle id="${t.id}" cx="${t.x}" cy="${t.y}" r="${this.terminalCfg.radius}" ` +
      `fill="${this.colors.black}" data-terminal="${t.terminal}"/>`
    ).join('\n') + '\n';
  }

  renderLabels(view, componentId, partId, terminals) {
    return terminals.map(t => {
      const pos = this.geometry.getLabelPosition(view, componentId, partId, 'terminal', t.terminal);
      return `<text x="${pos.x}" y="${pos.y}" font-size="8" fill="#333" font-weight="bold">${t.terminal}</text>`;
    }).join('\n') + '\n';
  }

  renderSymbol(view, componentId, partId, terminals, state) {
    const part = this.spec.components[componentId]?.parts[partId];
    if (!part) return '';
    return this.templateRenderer.render(part.type, terminals, part.variant, state);
  }

  getTerminalsForPart(view, componentId, partId) {
    const part = this.spec.components[componentId]?.parts[partId];
    if (!part) return [];
    return Object.keys(part.terminals || {}).map(tId => 
      this.geometry.getTerminal(view, componentId, partId, tId)
    );
  }
}

module.exports = { SymbolRendererV2 };

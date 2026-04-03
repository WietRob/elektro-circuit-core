const { GeometryEngine } = require('./geometry-engine.js');

/**
 * ViewAdapter - Clean separation of DIN and LAB views
 * 
 * Architecture:
 * - Same core (SymbolRenderer, StateEngine, Router) for both views
 * - View-specific: Rails, styling, coordinate system details
 * - NO circuit-specific logic
 * - NO view-whitelists
 * 
 * @phase Phase 2 - View Projection Layer
 * @status PRODUKTION
 */

/**
 * View configuration definitions
 * All view-specific values centralized here
 */
const VIEW_CONFIG = {
  DIN: {
    id: 'DIN',
    name: 'DIN-Ansicht',
    description: 'Stromlaufplan nach DIN-Norm',
    rails: {
      L: {
        type: 'line',
        y: 40,
        x1: 50,
        x2: 650,
        stroke: '#795548',
        strokeWidth: 3,
        label: { text: '+24V (L)', x: 30, y: 44, fill: '#795548', fontSize: 12, fontWeight: 'bold' }
      },
      N: {
        type: 'line',
        y: 370,
        x1: 50,
        x2: 650,
        stroke: '#1e88e5',
        strokeWidth: 3,
        label: { text: '0V (N)', x: 30, y: 374, fill: '#1e88e5', fontSize: 12, fontWeight: 'bold' }
      }
    },
    viewBox: '0 0 700 400',
    wireDefaults: {
      control: { color: '#1976d2', strokeWidth: 2 },
      load: { color: '#607d8b', strokeWidth: 2 },
      preinstalled: { color: '#607d8b', strokeWidth: 2 }
    }
  },
  LAB: {
    id: 'LAB',
    name: 'LAB-Ansicht',
    description: 'Laboraufbau (Physikalisch)',
    rails: {
      L: {
        type: 'rect',
        x: 50,
        y: 15,
        width: 400,
        height: 20,
        fill: '#e53935',
        stroke: '#333',
        label: { text: 'L +24V', x: 60, y: 28, fill: 'white', fontSize: 12 }
      },
      N: {
        type: 'rect',
        x: 50,
        y: 360,
        width: 400,
        height: 20,
        fill: '#1e88e5',
        stroke: '#333',
        label: { text: 'N', x: 60, y: 373, fill: 'white', fontSize: 12 }
      }
    },
    viewBox: '0 0 700 400',
    wireDefaults: {
      control: { color: '#1976d2', strokeWidth: 2 },
      load: { color: '#1976d2', strokeWidth: 2 },
      preinstalled: { color: '#607d8b', strokeWidth: 2 }
    }
  }
};

/**
 * ViewAdapter class
 * Handles view-specific projections without circuit-specific logic
 */
class ViewAdapter {
  constructor(viewType, geometryEngine) {
    if (!VIEW_CONFIG[viewType]) {
      throw new Error(`Unknown view type: ${viewType}. Must be 'DIN' or 'LAB'`);
    }
    
    this.viewType = viewType;
    this.config = VIEW_CONFIG[viewType];
    this.geometry = geometryEngine;
  }

  /**
   * Render Zonen (Kriterium 10)
   * 3 Hintergrund-Layer: Safety, Control, Output
   * Generische Labels ohne schaltungsspezifische Komponentennamen
   * Dynamisch aus tatsächlichen Komponentenpositionen berechnet
   */
  renderZones() {
    if (this.viewType !== 'DIN') return '';

    // Sammle alle Y-Positionen von Komponenten
    const componentYPositions = [];
    
    if (this.geometry && this.geometry.spec && this.geometry.spec.components) {
      for (const [componentId, component] of Object.entries(this.geometry.spec.components)) {
        // Sammle Y-Positionen aller Parts der Komponente
        for (const [partId, part] of Object.entries(component.parts || {})) {
          if (part.terminals) {
            for (const [terminalId, terminal] of Object.entries(part.terminals)) {
              try {
                const anchor = this.geometry.anchors[`${this.viewType}-${partId}-${terminalId}`];
                if (anchor && anchor.y) {
                  componentYPositions.push({
                    componentId,
                    partId,
                    terminalId,
                    y: anchor.y,
                    potential: terminal.potential || 'unknown'
                  });
                }
              } catch (e) {
                // Anchor nicht gefunden, überspringen
              }
            }
          }
        }
      }
    }

    // Berechne Zonen-Grenzen aus den tatsächlichen Positionen
    let safetyMinY = 60, safetyMaxY = 130;
    let controlMinY = 140, controlMaxY = 290;
    let outputMinY = 300, outputMaxY = 380;

    if (componentYPositions.length > 0) {
      // Sortiere nach Y-Position
      const sortedPositions = componentYPositions.sort((a, b) => a.y - b.y);
      const minY = sortedPositions[0].y;
      const maxY = sortedPositions[sortedPositions.length - 1].y;
      const range = maxY - minY;
      
      // Berechne dynamische Zonen basierend auf tatsächlichen Positionen
      // Safety: Obere 25% der Schaltung
      safetyMinY = Math.max(50, minY - 20);
      safetyMaxY = minY + range * 0.25;
      
      // Control: Mittlere 50% der Schaltung
      controlMinY = safetyMaxY + 10;
      controlMaxY = minY + range * 0.75;
      
      // Output: Untere 25% der Schaltung
      outputMinY = controlMaxY + 10;
      outputMaxY = Math.min(390, maxY + 20);
    }

    // Berechne L und N Rail Positionen
    const railL_Y = this.config.rails.L.y;
    const railN_Y = this.config.rails.N.y;
    
    // Justiere Zonen relativ zu den Rails
    const totalHeight = railN_Y - railL_Y;
    const padding = 15;
    
    safetyMinY = railL_Y + padding;
    safetyMaxY = railL_Y + totalHeight * 0.25;
    
    controlMinY = safetyMaxY + 5;
    controlMaxY = railL_Y + totalHeight * 0.75;
    
    outputMinY = controlMaxY + 5;
    outputMaxY = railN_Y - padding;

    let svg = '';

    // Zone Safety (oben) - dynamisch berechnet
    svg += `  <g id="zone-safety" class="zone">
`;
    svg += `    <rect x="50" y="${safetyMinY}" width="600" height="${safetyMaxY - safetyMinY}" fill="#ffebee" fill-opacity="0.3" stroke="none"/>
`;
    svg += `    <text x="60" y="${safetyMinY + 15}" font-size="10" fill="#c62828" font-weight="bold">SICHERHEIT</text>
`;
    svg += `  </g>
`;

    // Zone Control (Mitte) - dynamisch berechnet
    svg += `  <g id="zone-control" class="zone">
`;
    svg += `    <rect x="50" y="${controlMinY}" width="600" height="${controlMaxY - controlMinY}" fill="#e8f5e9" fill-opacity="0.3" stroke="none"/>
`;
    svg += `    <text x="60" y="${controlMinY + 15}" font-size="10" fill="#2e7d32" font-weight="bold">STEUERUNG</text>
`;
    svg += `  </g>
`;

    // Zone Output (unten) - dynamisch berechnet
    svg += `  <g id="zone-output" class="zone">
`;
    svg += `    <rect x="50" y="${outputMinY}" width="600" height="${outputMaxY - outputMinY}" fill="#fff3e0" fill-opacity="0.3" stroke="none"/>
`;
    svg += `    <text x="60" y="${outputMinY + 15}" font-size="10" fill="#ef6c00" font-weight="bold">AUSGANG</text>
`;
    svg += `  </g>
`;

    return svg;
  }

  /**
   * Render view-specific rails
   * Returns SVG for L and N rails based on view configuration
   */
  renderRails() {
    let svg = '';
    
    for (const [railId, railConfig] of Object.entries(this.config.rails)) {
      const domId = `${this.viewType}-RAIL-${railId}`;
      
      if (railConfig.type === 'line') {
        svg += `  <line id="${domId}" x1="${railConfig.x1}" y1="${railConfig.y}" x2="${railConfig.x2}" y2="${railConfig.y}" ` +
               `stroke="${railConfig.stroke}" stroke-width="${railConfig.strokeWidth}"/>\n`;
      } else if (railConfig.type === 'rect') {
        svg += `  <rect id="${domId}" x="${railConfig.x}" y="${railConfig.y}" ` +
               `width="${railConfig.width}" height="${railConfig.height}" ` +
               `fill="${railConfig.fill}" stroke="${railConfig.stroke}"/>\n`;
      }
      
      // Rail label
      if (railConfig.label) {
        const label = railConfig.label;
        svg += `  <text x="${label.x}" y="${label.y}" font-size="${label.fontSize}" ` +
               `fill="${label.fill}"${label.fontWeight ? ` font-weight="${label.fontWeight}"` : ''}>${label.text}</text>\n`;
      }
    }
    
    return svg;
  }

  /**
   * Get wire styling for this view
   * Returns color and stroke width based on wire type
   */
  getWireStyle(wireType) {
    return this.config.wireDefaults[wireType] || { color: '#000000', strokeWidth: 2 };
  }

  /**
   * Get view metadata
   */
  getViewInfo() {
    return {
      id: this.config.id,
      name: this.config.name,
      description: this.config.description,
      viewBox: this.config.viewBox
    };
  }

  /**
   * Check if a wire belongs to this view
   * Based on wire ID prefix (din-wire-* or lab-wire-*)
   * NO circuit-specific logic
   */
  isWireForView(wireId) {
    const expectedPrefix = this.viewType === 'DIN' ? 'din-wire' : 'lab-wire';
    return wireId.startsWith(expectedPrefix);
  }

  /**
   * Get the DOM ID prefix for components in this view
   */
  getDomIdPrefix() {
    return this.viewType;
  }

  /**
   * Get wire color for a wire
   * Uses wire.color if specified, otherwise view defaults
   */
  resolveWireColor(wire) {
    if (wire.color) return wire.color;
    const style = this.getWireStyle(wire.type);
    return style.color;
  }
}

/**
 * ViewAdapterFactory - Creates view adapters
 */
class ViewAdapterFactory {
  constructor(geometryEngine) {
    this.geometry = geometryEngine;
    this.adapters = new Map();
  }

  /**
   * Get or create adapter for view type
   */
  getAdapter(viewType) {
    if (!this.adapters.has(viewType)) {
      this.adapters.set(viewType, new ViewAdapter(viewType, this.geometry));
    }
    return this.adapters.get(viewType);
  }

  /**
   * Get both adapters (DIN and LAB)
   */
  getBothAdapters() {
    return {
      DIN: this.getAdapter('DIN'),
      LAB: this.getAdapter('LAB')
    };
  }

  /**
   * Clear adapter cache
   */
  clear() {
    this.adapters.clear();
  }
}

module.exports = {
  ViewAdapter,
  ViewAdapterFactory,
  VIEW_CONFIG
};

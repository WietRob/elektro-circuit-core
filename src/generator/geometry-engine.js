/**
 * GeometryEngine - Single Source of Geometry
 * 
 * Kanonische Geometriequelle: circuit.json → anchors
 * Keine doppelte Geometrie-Wahrheit.
 * 
 * @phase Phase 2 - Geometry Kernel
 * @status Implementierung
 */

class GeometryEngine {
  constructor(circuitSpec) {
    this.spec = circuitSpec;
    this.anchors = circuitSpec.anchors || {};
    
    // Cache für berechnete Werte
    this.cache = new Map();
    
    this.config = this.loadConfig(circuitSpec.config);
    this.symbolTemplates = this.initializeTemplates();
  }

  /**
   * Kanonische Terminal-Position
   * Direkter Zugriff auf anchors - keine Transformation, keine Offsets
   * 
   * @param {string} view - 'DIN' oder 'LAB'
   * @param {string} componentId - z.B. 'S1', 'K1'
   * @param {string} partId - z.B. 'S1-BUTTON', 'K1-COIL'
   * @param {string} terminalId - z.B. '14', 'A1'
   * @returns {TerminalPosition}
   */
  getTerminal(view, componentId, partId, terminalId) {
    const cacheKey = `terminal:${view}:${componentId}:${partId}:${terminalId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const anchorId = `${view}-${partId}-${terminalId}`;
    const anchor = this.anchors[anchorId];
    
    if (!anchor) {
      throw new Error(`Anchor nicht gefunden: ${anchorId}`);
    }

    // Zusatz-Informationen aus dem Modell holen
    const component = this.spec.components[componentId];
    const part = component?.parts[partId];
    const terminal = part?.terminals[terminalId];

    const result = {
      x: anchor.x,
      y: anchor.y,
      id: anchorId,
      component: componentId,
      part: partId,
      terminal: terminalId,
      type: terminal?.function || 'unknown',
      potential: terminal?.potential || 'unknown',
      view: view
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Bounds eines Parts - abgeleitet aus Terminalen + Template
   * Nicht manuell gespeichert, sondern berechnet
   * 
   * @param {string} view - 'DIN' oder 'LAB'
   * @param {string} componentId 
   * @param {string} partId
   * @returns {Bounds}
   */
  getPartBounds(view, componentId, partId) {
    const cacheKey = `partBounds:${view}:${componentId}:${partId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const component = this.spec.components[componentId];
    const part = component?.parts[partId];
    
    if (!part) {
      throw new Error(`Part nicht gefunden: ${componentId}.${partId}`);
    }

    // Alle Terminale des Parts sammeln
    const terminals = Object.keys(part.terminals || {}).map(tId => 
      this.getTerminal(view, componentId, partId, tId)
    );

    if (terminals.length === 0) {
      throw new Error(`Part hat keine Terminale: ${componentId}.${partId}`);
    }

    // Bounds aus Terminalen berechnen
    const xs = terminals.map(t => t.x);
    const ys = terminals.map(t => t.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Padding für Symbolkörper
    const padding = 10;
    
    const bounds = {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + 2 * padding,
      height: maxY - minY + 2 * padding,
      center: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
      },
      terminals: terminals
    };

    this.cache.set(cacheKey, bounds);
    return bounds;
  }

  /**
   * Bounds einer Komponente - aggregiert aus Parts
   * Für integrierte Parts: Parent-Bounds enthalten Child-Bounds
   * 
   * @param {string} view - 'DIN' oder 'LAB'
   * @param {string} componentId
   * @returns {Bounds}
   */
  getComponentBounds(view, componentId) {
    const cacheKey = `componentBounds:${view}:${componentId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const component = this.spec.components[componentId];
    if (!component) {
      throw new Error(`Komponente nicht gefunden: ${componentId}`);
    }

    // Alle Parts der Komponente
    const partIds = Object.keys(component.parts || {});
    
    if (partIds.length === 0) {
      throw new Error(`Komponente hat keine Parts: ${componentId}`);
    }

    // Für integrierte Parts: Parent-Bounds umfassen alle Child-Bounds
    const allBounds = partIds.map(partId => {
      try {
        return this.getPartBounds(view, componentId, partId);
      } catch (e) {
        // Part ohne Terminale überspringen
        return null;
      }
    }).filter(b => b !== null);

    if (allBounds.length === 0) {
      throw new Error(`Keine gültigen Bounds für Komponente: ${componentId}`);
    }

    const minX = Math.min(...allBounds.map(b => b.x));
    const maxX = Math.max(...allBounds.map(b => b.x + b.width));
    const minY = Math.min(...allBounds.map(b => b.y));
    const maxY = Math.max(...allBounds.map(b => b.y + b.height));

    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      center: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
      },
      parts: allBounds
    };

    this.cache.set(cacheKey, bounds);
    return bounds;
  }

  /**
   * Label-Position für Terminal oder Komponente
   * 
   * @param {string} view
   * @param {string} componentId
   * @param {string} partId
   * @param {string} labelKind - 'terminal' | 'component'
   * @param {string} [terminalId] - nur für terminal-Labels
   * @returns {LabelPosition}
   */
  getLabelPosition(view, componentId, partId, labelKind, terminalId = null) {
    const cacheKey = `label:${view}:${componentId}:${partId}:${labelKind}:${terminalId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result;

    if (labelKind === 'terminal' && terminalId) {
      // Terminal-Label: Relativ zum Terminal
      const terminal = this.getTerminal(view, componentId, partId, terminalId);
      result = {
        x: terminal.x + this.config.labelOffset.x,
        y: terminal.y + this.config.labelOffset.y,
        anchor: 'start',
        baseline: 'text-before-edge',
        text: terminalId,
        reference: terminal
      };
    } else if (labelKind === 'component') {
      // Komponenten-Label: Nahe dem Part
      const bounds = this.getPartBounds(view, componentId, partId);
      result = {
        x: bounds.center.x + this.config.componentLabelOffset.x,
        y: bounds.center.y + this.config.componentLabelOffset.y,
        anchor: 'start',
        baseline: 'middle',
        text: componentId,
        reference: bounds.center
      };
    } else {
      throw new Error(`Unbekannte Label-Art: ${labelKind}`);
    }

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Integrations-Metadaten für Parent/Child-Beziehungen
   * Unterscheidet elektrische Semantik von visueller Integration
   * 
   * @param {string} componentId
   * @param {string} partId
   * @returns {IntegrationMeta | null}
   */
  getIntegrationMeta(componentId, partId) {
    const cacheKey = `integration:${componentId}:${partId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const component = this.spec.components[componentId];
    const part = component?.parts[partId];

    if (!part) {
      return null;
    }

    // Prüfe auf visuelle Integration (visualPosition)
    if (part.visualPosition?.relativeTo) {
      const result = {
        // Elektrische Semantik
        component: componentId,
        part: partId,
        isIntegratedPart: true,
        
        // Visuelle Integration
        parent: componentId,
        relativeTo: part.visualPosition.relativeTo,
        offset: {
          x: part.visualPosition.offsetX || 0,
          y: part.visualPosition.offsetY || 0
        },
        integration: {
          type: 'internal',
          mechanism: 'relativePosition'
        },
        
        // Mechanische Kopplung (falls vorhanden)
        mechanicalCoupling: part.mechanicallyCoupledTo || null
      };

      this.cache.set(cacheKey, result);
      return result;
    }

    // Keine Integration definiert -> eigenständiger Part
    const result = {
      component: componentId,
      part: partId,
      isIntegratedPart: false,
      parent: componentId,
      integration: {
        type: 'external'
      }
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Alle Terminale einer View abrufen
   * Nützlich für Tests und Validierung
   * 
   * @param {string} view
   * @returns {TerminalPosition[]}
   */
  getAllTerminals(view) {
    return Object.entries(this.anchors)
      .filter(([id, anchor]) => anchor.view === view)
      .map(([id, anchor]) => ({
        x: anchor.x,
        y: anchor.y,
        id: id,
        component: anchor.component,
        part: anchor.part,
        terminal: anchor.terminal,
        view: view
      }));
  }

  /**
   * Cache löschen (für Tests)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Konfiguration laden - Custom oder Default
   */
  loadConfig(customConfig = {}) {
    const defaults = {
      labelOffset: { x: -8, y: -7 },
      componentLabelOffset: { x: 15, y: 25 },
      railPositions: {
        DIN: { L: 40, N: 360 },
        LAB: { L: 15, N: 360 }
      },
      symbolPadding: 10,
      contactGap: 8,
      contactBarHalfWidth: 8,
      coilHeight: 30,
      lampRadius: 18
    };
    
    return {
      ...defaults,
      ...customConfig,
      railPositions: {
        ...defaults.railPositions,
        ...(customConfig.railPositions || {})
      }
    };
  }

  /**
   * Symbol-Templates initialisieren
   */
  initializeTemplates() {
    return {
      button_mechanism: {
        getBounds: (terminals, isHorizontal) => {
          const xs = terminals.map(t => t.x);
          const ys = terminals.map(t => t.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          
          const padding = this.config.symbolPadding;
          
          return {
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + 2 * padding,
            height: maxY - minY + 2 * padding
          };
        }
      },
      coil: {
        getBounds: (terminals) => {
          const xs = terminals.map(t => t.x);
          const ys = terminals.map(t => t.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          
          const height = this.config.coilHeight;
          
          return {
            x: minX,
            y: minY - height / 2,
            width: maxX - minX,
            height: height
          };
        }
      },
      aux_no: {
        getBounds: (terminals) => {
          const xs = terminals.map(t => t.x);
          const ys = terminals.map(t => t.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          
          const padding = this.config.symbolPadding;
          
          return {
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + 2 * padding,
            height: maxY - minY + 2 * padding
          };
        }
      },
      lamp_element: {
        getBounds: (terminals) => {
          const centerX = terminals[0]?.x || 0;
          const minY = Math.min(...terminals.map(t => t.y));
          const maxY = Math.max(...terminals.map(t => t.y));
          const centerY = (minY + maxY) / 2;
          const radius = this.config.lampRadius;
          
          return {
            x: centerX - radius,
            y: centerY - radius,
            width: radius * 2,
            height: radius * 2
          };
        }
      }
    };
  }

  /**
   * Rail-Position für View ermitteln
   */
  getRailPosition(view, rail) {
    return this.config.railPositions[view]?.[rail] || null;
  }

  /**
   * Alle Komponenten-IDs abrufen
   */
  getAllComponentIds() {
    return Object.keys(this.spec.components || {});
  }

  /**
   * Alle Parts einer Komponente abrufen
   */
  getPartIds(componentId) {
    const component = this.spec.components[componentId];
    return Object.keys(component?.parts || {});
  }

  /**
   * Komponenten-Typ ermitteln
   */
  getComponentType(componentId) {
    return this.spec.components[componentId]?.type || 'unknown';
  }

  /**
   * Part-Typ ermitteln
   */
  getPartType(componentId, partId) {
    return this.spec.components[componentId]?.parts[partId]?.type || 'unknown';
  }
}

// Export für Node.js und Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GeometryEngine };
}

// TypeScript-ähnliche Dokumentation für IDE-Support
/**
 * @typedef {Object} TerminalPosition
 * @property {number} x
 * @property {number} y
 * @property {string} id
 * @property {string} component
 * @property {string} part
 * @property {string} terminal
 * @property {string} type
 * @property {string} potential
 * @property {string} view
 */

/**
 * @typedef {Object} Bounds
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {Point} center
 * @property {TerminalPosition[]} [terminals]
 * @property {Bounds[]} [parts]
 */

/**
 * @typedef {Object} LabelPosition
 * @property {number} x
 * @property {number} y
 * @property {string} anchor
 * @property {string} baseline
 * @property {string} text
 * @property {TerminalPosition|Point} reference
 */

/**
 * @typedef {Object} IntegrationMeta
 * @property {string} component
 * @property {string} part
 * @property {boolean} isIntegratedPart
 * @property {string} parent
 * @property {string} [relativeTo]
 * @property {Point} [offset]
 * @property {Object} integration
 * @property {string} [mechanicalCoupling]
 */

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */
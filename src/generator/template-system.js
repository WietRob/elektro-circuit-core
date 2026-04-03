/**
 * Template System - Declarative symbol definitions
 * NO magic numbers in production path - all values defined here
 */

/**
 * Base template for contact symbols (NO and NC)
 * Both share the same terminal structure but differ in visual representation
 */
const CONTACT_TEMPLATE = {
  type: 'contact',
  terminals: ['top', 'bottom'],
  geometry: {
    // Gap between terminal circle and contact bar
    terminalGap: 8,
    // Length of the connection bar
    barLength: 12,
    // Half-width of the closed-state bar (green bar)
    closedBarHalfWidth: 8,
    // Stroke width for lines
    strokeWidth: 2,
    // Stroke width for closed indicator
    closedStrokeWidth: 3
  },
  variants: {
    NO: {
      // Normally Open: Diagonal bar in open state, horizontal bar in closed state
      open: {
        elements: [
          { type: 'line', from: 'terminal:top', to: 'calc:diagonal', style: 'normal' }
        ]
      },
      closed: {
        elements: [
          { type: 'line', from: 'calc:closedLeft', to: 'calc:closedRight', style: 'closed' }
        ]
      }
    },
    NC: {
      // Normally Closed: Horizontal bar in open state (red), diagonal in closed
      open: {
        elements: [
          { type: 'line', from: 'calc:closedLeft', to: 'calc:closedRight', style: 'closed' }
        ]
      },
      closed: {
        elements: [
          { type: 'line', from: 'terminal:top', to: 'terminal:bottom', style: 'normal' }
        ]
      }
    }
  }
};

/**
 * Coil template - rectangle with diagonal
 */
const COIL_TEMPLATE = {
  type: 'coil',
  terminals: ['A1', 'A2'],
  geometry: {
    // Default width (calculated from terminal distance if null)
    width: null,
    // Height of coil rectangle
    height: 30,
    // Inset for diagonal line from corners
    diagonalInset: 5,
    // Stroke width
    strokeWidth: 2,
    // Diagonal line stroke width
    diagonalStrokeWidth: 1.5
  },
  // State-dependent styling
  states: {
    inactive: { stroke: 'colors.black' },
    active: { stroke: 'colors.active' }
  },
  elements: [
    { type: 'rect', from: 'calc:topLeft', to: 'calc:bottomRight', style: 'state:stroke' },
    { type: 'line', from: 'calc:diagStart', to: 'calc:diagEnd', style: 'diagonal' }
  ]
};

/**
 * Lamp template - circle with cross
 */
const LAMP_TEMPLATE = {
  type: 'lamp',
  terminals: ['IN', 'OUT'],
  geometry: {
    // Radius of lamp circle
    radius: 18,
    // Inset for cross lines from circle edge
    crossInset: 5,
    // Stroke width for circle
    strokeWidth: 2,
    // Stroke width for cross
    crossStrokeWidth: 1.5
  },
  // State-dependent styling
  states: {
    dark: { fill: 'colors.lampOff', stroke: 'colors.black' },
    lit: { fill: 'colors.lampOn', stroke: 'colors.lampOnStroke' }
  },
  elements: [
    { type: 'circle', center: 'calc:center', radius: 'geometry:radius', style: 'state:fill_stroke' },
    { type: 'line', from: 'calc:cross1Start', to: 'calc:cross1End', style: 'cross' },
    { type: 'line', from: 'calc:cross2Start', to: 'calc:cross2End', style: 'cross' }
  ]
};

/**
 * Button mechanism template - same as contact but with pressed state mapping
 */
const BUTTON_TEMPLATE = {
  type: 'button_mechanism',
  terminals: ['top', 'bottom'],
  geometry: {
    terminalGap: 8,
    barLength: 12,
    closedBarHalfWidth: 8,
    strokeWidth: 2,
    closedStrokeWidth: 3
  },
  // State mapping: pressed=true means closed circuit for NO, open for NC
  stateMapping: {
    NO: { pressed: 'closed', released: 'open' },
    NC: { pressed: 'open', released: 'closed' }
  },
  // References contact template for rendering
  baseTemplate: 'CONTACT_TEMPLATE'
};

/**
 * Color palette - centralized color definitions
 */
const COLOR_PALETTE = {
  black: '#000000',
  closed: '#4caf50',      // Green for NO closed contacts
  ncOpen: '#e53935',      // RED for NC-Marker (NC contact open state bar)
  active: '#4caf50',      // GREEN for active coils (was BLUE #1976d2)
  lampOn: '#ffeb3b',      // Yellow for lit lamps
  lampOff: '#fff8e1',     // Light yellow for dark lamps
  lampOnStroke: '#f57f17' // Orange stroke for lit lamps
};

/**
 * Terminal template - standardized terminal circles
 */
const TERMINAL_TEMPLATE = {
  type: 'terminal',
  geometry: {
    radius: 3,
    strokeWidth: 1.5
  },
  style: {
    fill: 'colors.black'
  }
};

/**
 * Template registry - maps part types to templates
 */
const TEMPLATE_REGISTRY = {
  aux_no: { base: CONTACT_TEMPLATE, variant: 'NO' },
  aux_nc: { base: CONTACT_TEMPLATE, variant: 'NC' },
  coil: { base: COIL_TEMPLATE },
  lamp_element: { base: LAMP_TEMPLATE },
  button_mechanism: { base: BUTTON_TEMPLATE }
};

/**
 * Calculation helpers for template geometry
 */
const CalculationHelpers = {
  /**
   * Calculate diagonal endpoint for NO contact
   */
  diagonal(tTop, tBottom, barLength, gap) {
    return {
      x: tTop.x + barLength - gap,
      y: tBottom.y - barLength
    };
  },

  /**
   * Calculate closed bar positions
   */
  closedBar(tTop, tBottom, halfWidth) {
    return {
      left: { x: tTop.x - halfWidth, y: tBottom.y },
      right: { x: tTop.x + halfWidth, y: tBottom.y }
    };
  },

  /**
   * Calculate coil rectangle bounds
   */
  coilBounds(a1, a2, height, isHorizontal) {
    if (isHorizontal) {
      const width = Math.abs(a2.x - a1.x);
      const x = Math.min(a1.x, a2.x);
      const y = a1.y - height / 2;
      return { x, y, width, height };
    } else {
      const width = 30;
      const h = Math.abs(a2.y - a1.y);
      const x = a1.x - width / 2;
      const y = Math.min(a1.y, a2.y);
      return { x, y, width, height: h };
    }
  },

  /**
   * Calculate coil diagonal points
   */
  coilDiagonal(bounds, inset, isHorizontal) {
    if (isHorizontal) {
      return {
        start: { x: bounds.x + inset, y: bounds.y + bounds.height - inset },
        end: { x: bounds.x + bounds.width - inset, y: bounds.y + inset }
      };
    } else {
      return {
        start: { x: bounds.x + inset, y: bounds.y + inset },
        end: { x: bounds.x + bounds.width - inset, y: bounds.y + bounds.height - inset }
      };
    }
  },

  /**
   * Calculate lamp center
   */
  lampCenter(input, output) {
    return {
      x: input.x,
      y: (input.y + output.y) / 2
    };
  },

  /**
   * Calculate lamp cross points
   */
  lampCross(center, radius, inset) {
    const effectiveRadius = radius - inset;
    return {
      cross1: {
        start: { x: center.x - effectiveRadius, y: center.y - effectiveRadius },
        end: { x: center.x + effectiveRadius, y: center.y + effectiveRadius }
      },
      cross2: {
        start: { x: center.x + effectiveRadius, y: center.y - effectiveRadius },
        end: { x: center.x - effectiveRadius, y: center.y + effectiveRadius }
      }
    };
  }
};

/**
 * TemplateRenderer - renders symbols using declarative templates
 * NO circuit-specific logic - purely template-driven
 */
class TemplateRenderer {
  constructor() {
    this.colors = COLOR_PALETTE;
  }

  /**
   * Get template for part type
   */
  getTemplate(partType) {
    const entry = TEMPLATE_REGISTRY[partType];
    if (!entry) return null;
    return { ...entry.base, variant: entry.variant };
  }

  /**
   * Render contact (NO/NC) using template
   */
  renderContact(terminals, template, variant, state) {
    const isNC = variant === 'NC';
    const isClosed = state.closed || false;
    const cfg = template.geometry;
    
    // Sort terminals top to bottom
    const sorted = terminals.slice().sort((a, b) => a.y - b.y);
    const tTop = sorted[0];
    const tBottom = sorted[1];

    // Calculate geometry
    const calc = CalculationHelpers;
    const closedPos = calc.closedBar(tTop, tBottom, cfg.closedBarHalfWidth);
    const diagonalPos = calc.diagonal(tTop, tBottom, cfg.barLength, cfg.terminalGap);

    let svg = '';

    // Terminal connection lines (always present)
    svg += `<line x1="${tTop.x - cfg.terminalGap}" y1="${tTop.y}" x2="${tTop.x}" y2="${tTop.y}" ` +
           `stroke="${this.colors.black}" stroke-width="${cfg.strokeWidth}"/>
`;
    svg += `<line x1="${tBottom.x}" y1="${tBottom.y}" x2="${tBottom.x + cfg.terminalGap}" y2="${tBottom.y}" ` +
           `stroke="${this.colors.black}" stroke-width="${cfg.strokeWidth}"/>
`;

    // State-dependent elements
    if (isNC) {
      // NC (Normally Closed): Contact is CLOSED at rest, opens when activated
      // Show RED DIAGONAL marker when closed (at rest), black diagonal when open
      const showRedMarker = isClosed;  // Show red when contact is closed (NC at rest)
      const showBlackDiagonal = !isClosed;  // Show black diagonal when contact is open (activated)
      
      if (showRedMarker) {
        // NC-Marker: RED DIAGONAL line when contact is closed at rest (per Goldstandard)
        svg += `<line x1="${tTop.x - 4}" y1="${tTop.y + 8}" x2="${tTop.x + 4}" y2="${tBottom.y - 8}" ` +
               `stroke="${this.colors.ncOpen}" stroke-width="${cfg.closedStrokeWidth}"/>
`;
      }
      if (showBlackDiagonal) {
        // Black diagonal when NC contact is open (activated)
        svg += `<line x1="${tTop.x}" y1="${tTop.y}" x2="${tBottom.x}" y2="${tBottom.y}" ` +
               `stroke="${this.colors.black}" stroke-width="${cfg.strokeWidth}"/>
`;
      }
    } else {
      // NO: Show diagonal when open, closed bar when closed
      const showOpen = !isClosed;
      const showClosed = isClosed;
      
      if (showOpen) {
        svg += `<line x1="${tTop.x}" y1="${tTop.y}" x2="${diagonalPos.x}" y2="${diagonalPos.y}" ` +
               `stroke="${this.colors.black}" stroke-width="${cfg.strokeWidth}"/>
`;
      }
      if (showClosed) {
        // NO contacts: Black horizontal bar when closed (nur Geometriewechsel, keine Farbänderung)
        svg += `<line x1="${closedPos.left.x}" y1="${closedPos.left.y}" x2="${closedPos.right.x}" y2="${closedPos.right.y}" ` +
               `stroke="${this.colors.black}" stroke-width="${cfg.closedStrokeWidth}"/>\n`;
      }
    }

    return svg;
  }

  /**
   * Render coil using template
   */
  renderCoil(terminals, template, state) {
    const a1 = terminals.find(t => t.terminal === 'A1');
    const a2 = terminals.find(t => t.terminal === 'A2');
    if (!a1 || !a2) return '';

    const cfg = template.geometry;
    const calc = CalculationHelpers;
    const isHorizontal = Math.abs(a2.x - a1.x) > Math.abs(a2.y - a1.y);
    const strokeColor = state.active ? this.colors.active : this.colors.black;

    const bounds = calc.coilBounds(a1, a2, cfg.height, isHorizontal);
    const diagonal = calc.coilDiagonal(bounds, cfg.diagonalInset, isHorizontal);

    let svg = `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" ` +
           `fill="none" stroke="${strokeColor}" stroke-width="${cfg.strokeWidth}"/>
`;
    svg += `<line x1="${diagonal.start.x}" y1="${diagonal.start.y}" ` +
           `x2="${diagonal.end.x}" y2="${diagonal.end.y}" ` +
           `stroke="${strokeColor}" stroke-width="${cfg.diagonalStrokeWidth}"/>
`;

    return svg;
  }

  /**
   * Render lamp using template
   */
  renderLamp(terminals, template, state) {
    const input = terminals.find(t => t.terminal === 'IN');
    const output = terminals.find(t => t.terminal === 'OUT');
    if (!input || !output) return '';

    const cfg = template.geometry;
    const calc = CalculationHelpers;
    const center = calc.lampCenter(input, output);
    const cross = calc.lampCross(center, cfg.radius, cfg.crossInset);

    const isLit = state.lit || false;
    const fillColor = isLit ? this.colors.lampOn : this.colors.lampOff;
    const strokeColor = isLit ? this.colors.lampOnStroke : this.colors.black;

    let svg = `<circle cx="${center.x}" cy="${center.y}" r="${cfg.radius}" ` +
           `fill="${fillColor}" stroke="${strokeColor}" stroke-width="${cfg.strokeWidth}"/>
`;
    svg += `<line x1="${cross.cross1.start.x}" y1="${cross.cross1.start.y}" ` +
           `x2="${cross.cross1.end.x}" y2="${cross.cross1.end.y}" ` +
           `stroke="${strokeColor}" stroke-width="${cfg.crossStrokeWidth}"/>
`;
    svg += `<line x1="${cross.cross2.start.x}" y1="${cross.cross2.start.y}" ` +
           `x2="${cross.cross2.end.x}" y2="${cross.cross2.end.y}" ` +
           `stroke="${strokeColor}" stroke-width="${cfg.crossStrokeWidth}"/>
`;

    return svg;
  }

  /**
   * Render button mechanism using template
   * Maps pressed state to open/closed based on variant
   */
  renderButton(terminals, template, variant, state) {
    // Default to NO (Normally Open) if variant not specified
    const effectiveVariant = variant || 'NO';
    const mapping = template.stateMapping[effectiveVariant];
    if (!mapping) return '';

    // Map pressed state to contact state using effective variant
    const isPressed = state.pressed || false;
    const contactState = { closed: isPressed ? (mapping.pressed === 'closed') : (mapping.released === 'closed') };

    // Render as contact with mapped state
    const contactTemplate = CONTACT_TEMPLATE;
    return this.renderContact(terminals, contactTemplate, variant, contactState);
  }

  /**
   * Main render entry point - template-driven, no circuit-specific logic
   */
  render(partType, terminals, variant, state) {
    const template = this.getTemplate(partType);
    if (!template) return '';

    switch (template.type) {
      case 'contact':
        return this.renderContact(terminals, template, variant, state);
      case 'coil':
        return this.renderCoil(terminals, template, state);
      case 'lamp':
        return this.renderLamp(terminals, template, state);
      case 'button_mechanism':
        return this.renderButton(terminals, template, variant, state);
      default:
        return '';
    }
  }
}

module.exports = {
  CONTACT_TEMPLATE,
  COIL_TEMPLATE,
  LAMP_TEMPLATE,
  BUTTON_TEMPLATE,
  TERMINAL_TEMPLATE,
  COLOR_PALETTE,
  TEMPLATE_REGISTRY,
  CalculationHelpers,
  TemplateRenderer
};

const { GeometryEngine } = require('./geometry-engine.js');

/**
 * OrthogonalRouter - Generisches Routing basierend auf Terminalen
 * 
 * Keine statischen JSON-Routen mehr.
 * Routing erfolgt orthogonal (nur horizontal/vertikal).
 */

class OrthogonalRouter {
  constructor(circuitSpec) {
    this.geometry = new GeometryEngine(circuitSpec);
    this.spec = circuitSpec;
    this.config = this.geometry.config;
  }

  /**
   * Route zwischen zwei Punkten orthogonal berechnen
   * 
   * @param {Object} from - {x, y} Startpunkt
   * @param {Object} to - {x, y} Endpunkt  
   * @param {Object} options - {preferHorizontal, avoid}
   * @returns {Array} - [{x, y}, ...] Route-Punkte
   */
  calculateRoute(from, to, options = {}) {
    const route = [];
    
    route.push({ x: from.x, y: from.y });
    
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    const threshold = options.threshold || 5;
    
    if (Math.abs(dx) < threshold) {
      route.push({ x: from.x, y: to.y });
    } else if (Math.abs(dy) < threshold) {
      route.push({ x: to.x, y: from.y });
    } else if (options.preferHorizontal) {
      route.push({ x: to.x, y: from.y });
      route.push({ x: to.x, y: to.y });
    } else {
      route.push({ x: from.x, y: to.y });
      route.push({ x: to.x, y: to.y });
    }
    
    return route;
  }

  /**
   * Wire-Route aus Spec-Wire berechnen
   * 
   * Wire-Format (alt): { fromAnchor, toAnchor }
   * Wire-Format (neu): { from: {...}, to: {...} }
   */
  routeWire(wire, view) {
    let fromEndpoint, toEndpoint;
    
    if (wire.fromAnchor && wire.toAnchor) {
      fromEndpoint = { anchor: wire.fromAnchor };
      toEndpoint = { anchor: wire.toAnchor };
    } else {
      fromEndpoint = wire.from;
      toEndpoint = wire.to;
    }
    
    const from = this.resolveEndpoint(fromEndpoint, view);
    const to = this.resolveEndpoint(toEndpoint, view);
    
    if (!from || !to) {
      throw new Error(`Cannot resolve endpoints for wire ${wire.id}`);
    }
    
    const route = this.calculateRoute(from, to, {
      preferHorizontal: this.shouldPreferHorizontal(from, to)
    });
    
    return {
      id: wire.id,
      segments: this.routeToSegments(route),
      type: wire.type,
      color: wire.color || this.getDefaultColor(wire.type)
    };
  }

  /**
   * Endpunkt auflösen (Terminal oder Rail)
   */
  resolveEndpoint(endpoint, view) {
    if (endpoint.anchor) {
      const anchor = this.spec.anchors[endpoint.anchor];
      if (anchor && anchor.view === view) {
        return { x: anchor.x, y: anchor.y, id: anchor.id };
      }
      return null;
    }
    
    if (endpoint.component && endpoint.part && endpoint.terminal) {
      try {
        const term = this.geometry.getTerminal(view, endpoint.component, endpoint.part, endpoint.terminal);
        return { x: term.x, y: term.y, id: term.id };
      } catch (e) {
        return null;
      }
    }
    
    if (endpoint.rail) {
      const railY = this.geometry.getRailPosition(view, endpoint.rail);
      if (railY !== null) {
        const anchor = Object.values(this.spec.anchors).find(a => 
          a.view === view && a.component === 'RAIL' && a.terminal === endpoint.rail
        );
        return { 
          x: anchor ? anchor.x : 0, 
          y: railY, 
          id: `${view}-RAIL-${endpoint.rail}`,
          isRail: true 
        };
      }
    }
    
    return null;
  }

  /**
   * Route in Segmente aufteilen
   */
  routeToSegments(route) {
    const segments = [];
    
    for (let i = 0; i < route.length - 1; i++) {
      segments.push({
        from: route[i],
        to: route[i + 1]
      });
    }
    
    return segments;
  }

  /**
   * Entscheiden ob horizontal oder vertikal bevorzugt
   */
  shouldPreferHorizontal(from, to) {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    return dx > dy;
  }

  /**
   * Default-Farbe für Wire-Typ
   */
  getDefaultColor(type) {
    const colors = {
      control: '#1976d2',
      load: '#1976d2',
      preinstalled: '#607d8b'
    };
    return colors[type] || '#000000';
  }

  /**
   * Alle Wires für eine View routen
   */
  routeAllWires(view) {
    const wires = this.spec.wires || [];
    const routed = [];
    
    for (const wire of wires) {
      if (wire.id && wire.id.startsWith(view.toLowerCase())) {
        try {
          const routedWire = this.routeWire(wire, view);
          routed.push(routedWire);
        } catch (e) {
          console.warn(`Failed to route ${wire.id}: ${e.message}`);
        }
      }
    }
    
    return routed;
  }

  /**
   * Wire-Route validieren
   */
  validateRoute(route) {
    const errors = [];
    
    if (!route || route.length < 2) {
      errors.push('Route too short');
      return errors;
    }
    
    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      
      const dx = Math.abs(to.x - from.x);
      const dy = Math.abs(to.y - from.y);
      
      if (dx > 0.1 && dy > 0.1) {
        errors.push(`Diagonal segment at index ${i}`);
      }
    }
    
    return errors;
  }
}

module.exports = { OrthogonalRouter };

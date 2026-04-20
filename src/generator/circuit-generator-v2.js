/**
 * CircuitGeneratorV2 - PRODUKTIONS-GENERATOR
 * 
 * Architektur:
 * - Single Source of Geometry: circuit.json → anchors
 * - GeometryEngine: Kanonische Terminal-Positionen
 * - SymbolRendererV2: Template-basiertes Rendering
 * - ViewAdapter: DIN (Master) / LAB (Projektion)
 * 
 * @status PRODUKTION - Ab 2026-03-12 der einzige aktive Pfad
 * @deprecated Legacy-Renderer wird in v3.0 entfernt
 */

const fs = require('fs');
const path = require('path');
const { GeometryEngine } = require('./geometry-engine.js');
const { SymbolRendererV2 } = require('./symbol-renderer-v2.js');
const { OrthogonalRouter } = require('./orthogonal-router.js');
const { StateEngine } = require('./state-engine.js');
const { ViewAdapterFactory } = require('./view-adapter.js');

class CircuitGeneratorV2 {
  constructor(specPath, options = {}) {
    // Pfad kann String oder Object sein (für Tests)
    if (typeof specPath === 'string') {
      this.spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
      this.specPath = specPath;
    } else {
      this.spec = specPath;
      this.specPath = null;
    }
    
    // PRODUKTION: Neue Architektur ist immer aktiv
    // Flag nur für temporäre Notfallschalter (wird in v3.0 entfernt)
    this.options = {
      useNewRenderer: true,
      generateStates: options.generateStates !== false,
      mode: options.mode || 'overlay',
      outputDir: options.outputDir || null,
      ...options
    };
    
    // Kern-Architektur initialisieren
    this.geometry = new GeometryEngine(this.spec);
    this.symbolRenderer = new SymbolRendererV2(this.spec);
    this.router = new OrthogonalRouter(this.spec);
    this.stateEngine = new StateEngine(this.spec);
    this.viewAdapterFactory = new ViewAdapterFactory(this.geometry);

    this.validateSpec();
    console.log(`✓ CircuitGeneratorV2 initialized: ${this.spec.circuitId}`);
  }

  validateSpec() {
    const required = ['circuitId', 'components', 'anchors', 'wires', 'states'];
    for (const field of required) {
      if (!this.spec[field]) {
        throw new Error('Spec validation failed: missing ' + field);
      }
    }
    console.log('✓ Spec validation passed');
  }

  generate(circuitState = null) {
    return this.buildHTML(circuitState);
  }

  /**
   * PRODUKTION: renderPart
   * Nutzt immer SymbolRendererV2 (GeometryEngine-basiert)
   * Legacy-Pfad entfernt in v3.0
   */
  renderPart(partId, part, componentId, viewType, state = {}) {
    return this.renderPartV2(partId, part, componentId, viewType, state);
  }

  /**
   * NEUER PFAD (V2)
   * State-basiertes Rendering über GeometryEngine
   */
  renderPartV2(partId, part, componentId, viewType, state = {}) {
    try {
      // State für diesen Part bestimmen
      const partState = this.determinePartState(componentId, partId, state);
      
      // Symbol-Rendering über neue Engine mit State
      const svg = this.symbolRenderer.renderPart(viewType, componentId, partId, partState);
      
      if (!svg || svg === '') {
        console.warn(`V2 Renderer returned empty for ${componentId}.${partId}`);
        return '';
      }
      
      return svg;
    } catch (error) {
      console.error(`V2 Renderer failed for ${componentId}.${partId}:`, error.message);
      return '';
    }
  }

  determinePartState(componentId, partId, globalState) {
    const fullPartId = `${componentId}-${partId}`;
    const part = this.spec.components[componentId]?.parts[partId];
    
    if (!part) return {};
    
    const stateValue = globalState[fullPartId] || globalState[partId] || globalState[componentId];
    
    const state = {};
    
    if (part.type === 'button_mechanism') {
      state.pressed = stateValue === 'pressed' || stateValue === 'closed';
    }
    
    if (part.type === 'coil') {
      state.active = stateValue === 'active';
      state.attracted = state.active;
    }
    
    if (part.type === 'aux_no') {
      state.closed = stateValue === 'closed';
    }
    
    if (part.type === 'aux_nc') {
      state.closed = stateValue === 'closed';
    }
    
    if (part.type === 'lamp_element') {
      state.lit = stateValue === 'lit';
    }
    
    return state;
  }

  renderWiresV2(viewType, state = null, viewAdapter = null) {
    const wirePrefix = viewType === 'DIN' ? 'din-wire' : 'lab-wire';
    let svg = '';
    
    const routedWires = this.router.routeAllWires(viewType);
    
    for (const routedWire of routedWires) {
      if (!routedWire.id.startsWith(wirePrefix)) continue;
      
      const wireColor = viewAdapter ? viewAdapter.resolveWireColor(routedWire) : routedWire.color;
      
      for (let i = 0; i < routedWire.segments.length; i++) {
        const seg = routedWire.segments[i];
        
        svg += `  <line id="${routedWire.id}-seg${i}" class="wire ${routedWire.type}" ` +
               `x1="${seg.from.x}" y1="${seg.from.y}" x2="${seg.to.x}" y2="${seg.to.y}" ` +
               `stroke="${wireColor}" stroke-width="2" ` +
               `data-parent-wire="${routedWire.id}"/>\n`;
      }
    }
    
    return svg;
  }

  renderPartLegacy(partId, part, componentId, viewType) {
    return this.renderPartOld(partId, part, componentId, viewType);
  }

  // [ALLE ALTERN METHODEN AUS circuit-generator.js]
  renderPartOld(partId, part, componentId, viewType) {
    const anchorPrefix = viewType === 'DIN' ? 'DIN' : 'LAB';
    
    const partAnchor = Object.values(this.spec.anchors).find(
      a => a.component === componentId && a.part === partId && a.view === viewType
    );
    
    if (!partAnchor) {
      console.warn('No anchor found for ' + componentId + '.' + partId);
      return '';
    }

    switch (part.type) {
      case 'button_mechanism':
        return this.renderButtonOld(componentId, partId, part, partAnchor, viewType);
      case 'coil':
        return this.renderCoilOld(componentId, partId, part, partAnchor, viewType);
      case 'aux_no':
        return this.renderAuxContactOld(componentId, partId, part, partAnchor, viewType);
      case 'lamp_element':
        return this.renderLampOld(componentId, partId, part, partAnchor, viewType);
      default:
        throw new Error('Unsupported part type: ' + part.type);
    }
  }

  renderButtonOld(componentId, partId, part, anchor, viewType) {
    // [ORIGINAL RENDER CODE - gekürzt für Lesbarkeit]
    const variant = part.variant || 'NO';
    const isDIN = viewType === 'DIN';
    const domId = viewType + '-' + componentId + '-' + partId.replace(componentId + '-', '');
    
    if (isDIN) {
      const x = anchor.x;
      const y = anchor.y;
      const y2 = y + 50; // MAGIC NUMBER - Legacy!
      const termIds = Object.keys(part.terminals || {});
      const t1 = termIds[0] || '13';
      const t2 = termIds[1] || '14';
      
      return '<g id="' + domId + '" class="component switch" data-component="' + componentId + '">' +
        '<circle id="' + domId + '-' + t1 + '" cx="' + x + '" cy="' + y + '" r="3" fill="#000"/>' +
        '<circle id="' + domId + '-' + t2 + '" cx="' + x + '" cy="' + y2 + '" r="3" fill="#000"/>' +
        // ... rest of legacy code
        '</g>';
    } else {
      // LAB View
      return '<g id="' + domId + '">...</g>';
    }
  }

  renderCoilOld(componentId, partId, part, anchor, viewType) {
    const isDIN = viewType === 'DIN';
    const domId = viewType + '-' + componentId + '-' + partId.replace(componentId + '-', '');
    
    if (isDIN) {
      const x = anchor.x;
      const y = anchor.y;
      return '<g id="' + domId + '">' +
        '<circle cx="' + x + '" cy="' + (y-17) + '" r="3"/>' + // MAGIC: y-17
        '<rect x="' + (x-15) + '" y="' + y + '" width="30" height="40"/>' + // MAGIC
        '</g>';
    }
    return '';
  }

  renderAuxContactOld(componentId, partId, part, anchor, viewType) {
    // Legacy implementation
    return '';
  }

  renderLampOld(componentId, partId, part, anchor, viewType) {
    // Legacy implementation  
    return '';
  }

  /**
   * HAUPT-HTML GENERIERUNG
   */
  buildHTML(circuitState = null) {
    const title = this.spec.circuitId;
    const isOverlay = this.options.mode === 'overlay';

    const dinSVG = this.generateViewSVG('DIN', circuitState);
    const labSVG = this.generateViewSVG('LAB', circuitState);

    const controlsHtml = isOverlay ? this.generateInteractiveControls() : '';
    const scriptHtml = isOverlay ? `<script>\n${this.generateInteractiveScript()}</script>` : '';
    const controlsSection = isOverlay
      ? `<div class="controls">\n  <div id="state-display">Status: initial</div>\n  ${controlsHtml}</div>`
      : '';

    return `<!DOCTYPE html>
<!-- CircuitGeneratorV2: ${title} ${this.options.mode} -->
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="generator" content="CircuitGeneratorV2">
<title>${title} - ${isOverlay ? 'Interaktive Schaltung' : 'Schaltplan'}</title>
<style>
* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; margin: 0; padding: 10px; background: #f5f5f5; }
.views { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.view { background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.svg-container { flex: 1; border: 1px solid #ddd; overflow: auto; background: #fafafa; }
.wire { stroke-width: 2; fill: none; pointer-events: none; }
.wire.control { stroke: #1976d2; }
.wire.load { stroke: #607d8b; }
.component { cursor: pointer; }
.component:hover { filter: drop-shadow(0 0 8px rgba(0,150,255,0.5)); }
.controls { margin: 15px 0; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.controls button { margin: 5px; padding: 10px 20px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px; background: #f0f0f0; }
.controls button:hover { background: #e0e0e0; }
.controls button.primary { background: #1976d2; color: white; border-color: #1976d2; }
.controls button.primary:hover { background: #1565c0; }
#state-display { margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 4px; font-weight: bold; }
</style>
</head>
<body>
<h1>${title.toUpperCase()}</h1>
${controlsSection}
<div class="views">
  <div class="view" id="din-view">
    <h3>DIN-Ansicht</h3>
    <div class="svg-container">
      <svg id="din-schematic" viewBox="0 0 700 400">
        ${dinSVG}
      </svg>
    </div>
  </div>
  <div class="view" id="lab-view">
    <h3>LAB-Ansicht</h3>
    <div class="svg-container">
      <svg id="labor-schematic" viewBox="0 0 700 400">
        ${labSVG}
      </svg>
    </div>
  </div>
</div>
${scriptHtml}
</body>
</html>`;
  }

  /**
   * STANDALONE SVG GENERIERUNG
   * Erzeugt eine eigenständige .svg-Datei für eine Ansicht (DIN oder LAB)
   */
  buildStandaloneSVG(viewType, circuitState = null) {
    const title = `${this.spec.circuitId} ${viewType}`;
    const viewBox = '0 0 700 400';
    const width = 700;
    const height = 400;
    
    const content = this.generateViewSVG(viewType, circuitState);
    
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- CircuitGeneratorV2: ${title} ${this.options.mode} -->
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="${viewBox}"
     width="${width}" height="${height}"
     version="1.1">
  <title>${title}</title>
  <desc>${this.spec.circuitId} - ${viewType} Ansicht (${this.options.mode})</desc>
  ${content}
</svg>`;
  }

  /**
   * Öffentliche API für SVG-Export
   * @param {string} viewType - 'DIN' oder 'LAB'
   * @param {Object} circuitState - Optionaler Zustand
   * @returns {string} Vollständige SVG-Datei
   */
  generateSVG(viewType = 'DIN', circuitState = null) {
    return this.buildStandaloneSVG(viewType, circuitState);
  }

  generateViewSVG(viewType, circuitState = null) {
    let svg = `<!-- CircuitGeneratorV2: ${this.spec.circuitId} ${viewType} -->\n`;
    
    let state;
    if (circuitState) {
      state = circuitState;
    } else {
      this.stateEngine.reset();
      state = this.stateEngine.getFullState();
    }
    
    // View-Adapter für saubere Trennung DIN/LAB
    const viewAdapter = this.viewAdapterFactory.getAdapter(viewType);
    
    const isOverlay = this.options.mode === 'overlay';

    // === BASIS-LAYER: Rails, Wires, Geometrische Junctions ===
    if (isOverlay) {
      svg += viewAdapter.renderZones();
    }
    svg += viewAdapter.renderRails();
    svg += this.renderWiresV2(viewType, state, viewAdapter);
    svg += this.renderWireJunctions(viewType);

    // === TOPOLOGIE-LAYER (nur im Overlay-Modus) ===
    if (isOverlay && viewType === 'DIN') {
      if (this.spec.topology) {
        svg += this.renderTopologyOverlay(viewType);
      } else {
        svg += this.renderGenericPathLabels(viewType);
      }
    }
    
    // === KOMPONENTEN-LAYER ===
    svg += this.renderComponents(viewType, state);
    
    return svg;
  }
  
  /**
   * Rendert alle Komponenten als kanonische SVG-Gruppen
   */
  renderComponents(viewType, state) {
    let svg = '';
    
    for (const [componentId, component] of Object.entries(this.spec.components)) {
      const idPrefix = viewType === 'DIN' ? 'din' : 'labor';
      const canonicalId = `${idPrefix}-${componentId}`;
      
      // Prüfe ob Komponente mechanisch gekoppelte Parts hat
      const hasCoupledParts = this.hasMechanicallyCoupledParts(component);
      
      if (hasCoupledParts) {
        // Einheit mit Container für gekoppelte Komponenten
        svg += `  <g id="${canonicalId}" class="component-unit">
`;
        // Dynamisch berechneter Rahmen um die Einheit
        svg += this.renderComponentUnitFrame(viewType, componentId, component);
        
        for (const [partId, part] of Object.entries(component.parts || {})) {
          let canonicalPartId = partId.replace(`${componentId}-`, '');
          if (canonicalPartId === 'AUX-NO') canonicalPartId = 'AUX';
          if (canonicalPartId === 'AUX-NC') canonicalPartId = 'AUX';
          const partCanonicalId = `${idPrefix}-${componentId}-${canonicalPartId}`;
          const partSvg = this.renderPart(partId, part, componentId, viewType, state);
          if (partSvg) {
            svg += `    <g id="${partCanonicalId}">
${partSvg}    </g>
`;
          }
        }
        
        // Dynamisch berechnete Kopplungslinien
        svg += this.renderComponentCouplings(viewType, componentId, component);
        svg += '  </g>\n';
      } else {
        // Standard-Komponenten mit kanonischer ID
        let componentSvg = '';
        for (const [partId, part] of Object.entries(component.parts || {})) {
          componentSvg += this.renderPart(partId, part, componentId, viewType, state);
        }
        
        if (componentSvg) {
          svg += `  <g id="${canonicalId}" class="component">
${componentSvg}  </g>
`;
        }
      }
    }
    
    return svg;
  }

  /**
   * Prüft ob eine Komponente mechanisch gekoppelte Parts hat
   */
  hasMechanicallyCoupledParts(component) {
    for (const part of Object.values(component.parts || {})) {
      if (part.mechanicallyCoupledTo) {
        return true;
      }
    }
    return false;
  }

  /**
   * Rendert einen Rahmen um eine Komponenten-Einheit (dynamisch berechnet)
   */
  renderComponentUnitFrame(viewType, componentId, component) {
    if (viewType !== 'DIN') return '';
    
    try {
      // Bounds aller Parts der Komponente berechnen
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      for (const partId of Object.keys(component.parts || {})) {
        try {
          const bounds = this.geometry.getPartBounds(viewType, componentId, partId);
          minX = Math.min(minX, bounds.x);
          minY = Math.min(minY, bounds.y);
          maxX = Math.max(maxX, bounds.x + bounds.width);
          maxY = Math.max(maxY, bounds.y + bounds.height);
        } catch (e) {
          // Part ohne Bounds überspringen
        }
      }
      
      if (minX === Infinity) return '';
      
      // Rahmen mit Padding
      const padding = 10;
      const x = minX - padding;
      const y = minY - padding;
      const width = maxX - minX + 2 * padding;
      const height = maxY - minY + 2 * padding;
      
      return `    <rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
             `fill="none" stroke="#4caf50" stroke-width="2" stroke-dasharray="none" ` +
             `class="component-unit-frame"/>
`;
    } catch (error) {
      console.warn(`Could not render frame for ${componentId}:`, error.message);
      return '';
    }
  }

  /**
   * Rendert mechanische Kopplungslinien zwischen Parts (dynamisch berechnet)
   */
  renderComponentCouplings(viewType, componentId, component) {
    if (viewType !== 'DIN') return '';
    
    let svg = '';
    
    for (const [partId, part] of Object.entries(component.parts || {})) {
      if (part.mechanicallyCoupledTo) {
        try {
          // Quell-Part Bounds
          const sourceBounds = this.geometry.getPartBounds(viewType, componentId, partId);
          
          // Ziel-Part aus mechanicallyCoupledTo extrahieren
          // Format: "K1-COIL.ANKER" -> componentId="K1", partId="K1-COIL"
          const targetRef = part.mechanicallyCoupledTo;
          const [targetPartFull, targetTerminal] = targetRef.split('.');
          
          // Versuche Ziel-Part in derselben Komponente zu finden
          let targetBounds = null;
          for (const [pid, p] of Object.entries(component.parts || {})) {
            if (pid === targetPartFull || `${componentId}-${pid}` === targetPartFull) {
              targetBounds = this.geometry.getPartBounds(viewType, componentId, pid);
              break;
            }
          }
          
          if (targetBounds) {
            // Kopplungslinie zwischen den Zentren der Parts
            const x1 = sourceBounds.x + sourceBounds.width / 2;
            const y1 = sourceBounds.y + sourceBounds.height / 2;
            const x2 = targetBounds.x + targetBounds.width / 2;
            const y2 = targetBounds.y + targetBounds.height / 2;
            
            svg += `    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
                   `stroke="#212121" stroke-width="1.5" stroke-dasharray="4,2" ` +
                   `class="mechanical-coupling"/>
`;
          }
        } catch (error) {
          console.warn(`Could not render coupling for ${componentId}.${partId}:`, error.message);
        }
      }
    }
    
    return svg;
  }
  
  /**
   * Fallback: Generische Pfad-Labels für Familien ohne explizite Topologie
   */
  renderGenericPathLabels(viewType) {
    if (viewType !== 'DIN') return '';
    
    const paths = this.spec.currentPaths || [];
    if (paths.length === 0) return '';
    
    let svg = '';
    const pathNames = ['Pfad 1', 'Pfad 2', 'Pfad 3', 'Pfad 4'];
    const pathPositions = this.calculatePathPositions(paths, viewType);
    
    const circuitId = this.spec.circuitId;
    pathPositions.forEach((pos, index) => {
      if (pos && pathNames[index]) {
        svg += `  <text x="${pos.x}" y="${pos.y - 8}" text-anchor="middle" font-size="8" fill="#555" font-style="italic" class="topology-marker topology-generic-path" data-topology-type="generic-path" data-topology-index="${index}" data-circuit="${circuitId}">${pathNames[index]}</text>\n`;
      }
    });
    
    return svg;
  }
  
  /**
   * TOPOLOGIE-OVERLAY: Rendert fachliche Topologie-Marker und semantische Labels
   * 
   * Unterstützt zwei Topologieformen:
   * 1. Branch-Topologie (Selbsthaltung): serial_gate → split → branches → merge
   * 2. Stage-Topologie (Folgeschaltung): stages → freigabe
   * 
   * HÄRTUNG: Mit data-Attributen für maschinelle Verifikation
   */
  renderTopologyOverlay(viewType) {
    if (viewType !== 'DIN') return '';
    
    const topology = this.spec.topology;
    if (!topology) return '';
    
    // HÄRTUNG: Validiere Topologie-Referenzen vor Rendering
    this.validateTopologyReferences(topology);
    
    let svg = '';
    
    // Form 1: Branch-Topologie (Selbsthaltung)
    if (topology.split) {
      svg += this.renderBranchTopology(topology, viewType);
    }
    
    // Form 2: Stage-Topologie (Folgeschaltung)
    if (topology.stages) {
      svg += this.renderStageTopology(topology, viewType);
    }
    
    return svg;
  }
  
  /**
   * HÄRTUNG: Validiert dass alle Topologie-Referenzen auf existierende Devices zeigen
   */
  validateTopologyReferences(topology) {
    const issues = [];
    
    // Validiere serial_gate
    if (topology.serial_gate?.device) {
      const pos = this.getDevicePosition(topology.serial_gate.device, 'DIN');
      if (!pos) issues.push(`serial_gate.device "${topology.serial_gate.device}" not found`);
    }
    
    // Validiere split
    if (topology.split?.after) {
      const pos = this.getDeviceOutputPosition(topology.split.after, 'DIN');
      if (!pos) issues.push(`split.after "${topology.split.after}" not found`);
    }
    
    if (topology.split?.branches) {
      for (const branch of topology.split.branches) {
        if (branch.device) {
          const pos = this.getDevicePosition(branch.device, 'DIN');
          if (!pos) issues.push(`branch.device "${branch.device}" not found`);
        }
      }
    }
    
    // Validiere merge
    if (topology.merge?.before) {
      const pos = this.getDeviceInputPosition(topology.merge.before, 'DIN');
      if (!pos) issues.push(`merge.before "${topology.merge.before}" not found`);
    }
    
    // Validiere stages
    if (topology.stages) {
      for (const stage of topology.stages) {
        if (stage.device) {
          const pos = this.getDevicePosition(stage.device, 'DIN');
          if (!pos) issues.push(`stage.device "${stage.device}" not found`);
        }
      }
    }
    
    // Validiere freigabe
    if (topology.freigabe?.from) {
      const pos = this.getDevicePosition(topology.freigabe.from, 'DIN');
      if (!pos) issues.push(`freigabe.from "${topology.freigabe.from}" not found`);
    }
    if (topology.freigabe?.to) {
      const pos = this.getDevicePosition(topology.freigabe.to, 'DIN');
      if (!pos) issues.push(`freigabe.to "${topology.freigabe.to}" not found`);
    }
    
    if (issues.length > 0) {
      console.warn(`[Topology Validation] ${this.spec.circuitId}:`, issues.join('; '));
    }
  }
  
  renderBranchTopology(topology, viewType) {
    let svg = '';
    const circuitId = this.spec.circuitId;
    
    if (topology.serial_gate?.device) {
      const gatePos = this.getDevicePosition(topology.serial_gate.device, viewType);
      if (gatePos && topology.serial_gate.role) {
        svg += `  <text x="${gatePos.x}" y="${gatePos.y - 25}" text-anchor="middle" font-size="9" fill="#c62828" font-weight="bold" class="topology-marker topology-gate" data-topology-type="serial_gate" data-topology-device="${topology.serial_gate.device}" data-circuit="${circuitId}">${topology.serial_gate.role}</text>\n`;
      }
    }
    
    if (topology.split?.after) {
      const splitPos = this.getDeviceOutputPosition(topology.split.after, viewType);
      if (splitPos) {
        svg += `  <circle cx="${splitPos.x}" cy="${splitPos.y}" r="5" fill="#1976d2" stroke="#0d47a1" stroke-width="2" class="topology-marker topology-split" data-topology-type="split" data-topology-after="${topology.split.after}" data-circuit="${circuitId}"/>\n`;
        svg += `  <text x="${splitPos.x}" y="${splitPos.y - 10}" text-anchor="middle" font-size="8" fill="#0d47a1" font-weight="bold" class="topology-marker topology-split-label" data-topology-type="split-label" data-circuit="${circuitId}">SPLIT</text>\n`;
      }
    }
    
    if (topology.split?.branches) {
      for (const branch of topology.split.branches) {
        const pos = this.getDevicePosition(branch.device, viewType);
        if (pos && branch.role) {
          svg += `  <text x="${pos.x}" y="${pos.y - 15}" text-anchor="middle" font-size="10" fill="#2e7d32" font-weight="bold" class="topology-marker topology-branch" data-topology-type="branch" data-topology-branch="${branch.id}" data-topology-device="${branch.device}" data-topology-role="${branch.role}" data-circuit="${circuitId}">${branch.role}</text>\n`;
        }
      }
    }
    
    if (topology.merge?.before) {
      const mergePos = this.getDeviceInputPosition(topology.merge.before, viewType);
      if (mergePos) {
        svg += `  <circle cx="${mergePos.x}" cy="${mergePos.y}" r="5" fill="#e53935" stroke="#b71c1c" stroke-width="2" class="topology-marker topology-merge" data-topology-type="merge" data-topology-before="${topology.merge.before}" data-circuit="${circuitId}"/>\n`;
        svg += `  <text x="${mergePos.x}" y="${mergePos.y - 10}" text-anchor="middle" font-size="8" fill="#b71c1c" font-weight="bold" class="topology-marker topology-merge-label" data-topology-type="merge-label" data-circuit="${circuitId}">MERGE</text>\n`;
      }
    }
    
    return svg;
  }
  
  renderStageTopology(topology, viewType) {
    let svg = '';
    const circuitId = this.spec.circuitId;
    
    if (topology.stages) {
      for (const stage of topology.stages) {
        if (stage.device && stage.role) {
          const stagePos = this.getDevicePosition(stage.device, viewType);
          if (stagePos) {
            const yOffset = stage.id === 'stage1' ? -35 : -15;
            const color = stage.id === 'stage1' ? '#c62828' : '#2e7d32';
            svg += `  <text x="${stagePos.x}" y="${stagePos.y + yOffset}" text-anchor="middle" font-size="9" fill="${color}" font-weight="bold" class="topology-marker topology-stage" data-topology-type="stage" data-topology-stage="${stage.id}" data-topology-device="${stage.device}" data-topology-role="${stage.role}" data-circuit="${circuitId}">${stage.role}</text>\n`;
          }
        }
      }
    }
    
    if (topology.freigabe?.from && topology.freigabe?.to) {
      const fromPos = this.getDevicePosition(topology.freigabe.from, viewType);
      const toPos = this.getDevicePosition(topology.freigabe.to, viewType);
      if (fromPos && toPos && topology.freigabe.role) {
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2 - 10;
        svg += `  <text x="${midX}" y="${midY}" text-anchor="middle" font-size="8" fill="#ff6f00" font-weight="bold" class="topology-marker topology-freigabe" data-topology-type="freigabe" data-topology-from="${topology.freigabe.from}" data-topology-to="${topology.freigabe.to}" data-topology-role="${topology.freigabe.role}" data-circuit="${circuitId}">${topology.freigabe.role}</text>\n`;
      }
    }
    
    return svg;
  }
  
  /**
   * Hilfsmethode: Ermittelt die Position eines Devices oder Parts
   */
  getDevicePosition(deviceId, viewType) {
    // Suche nach Anchors fuer dieses Device
    for (const [anchorId, anchor] of Object.entries(this.spec.anchors || {})) {
      if (anchor.component === deviceId && anchor.view === viewType) {
        return { x: anchor.x, y: anchor.y };
      }
    }
    
    // Suche nach Part-Anchors (z.B. K1-AUX-NO als deviceId)
    for (const [anchorId, anchor] of Object.entries(this.spec.anchors || {})) {
      if (anchor.view === viewType) {
        const anchorPart = anchor.part || '';
        // Pruefe ob der Anchor zu einem Part passt (z.B. K1-AUX-NO)
        if (anchorPart === deviceId || anchorPart.endsWith(deviceId) || 
            (deviceId.includes('-') && anchor.component + '-' + anchorPart === deviceId)) {
          return { x: anchor.x, y: anchor.y };
        }
      }
    }
    
    // Fallback: Suche in Parts ueber Geometrie
    for (const [componentId, component] of Object.entries(this.spec.components || {})) {
      const parts = component.parts || {};
      
      // Direkte Part-ID-Suche
      for (const partId of Object.keys(parts)) {
        const fullPartId = componentId + '-' + partId;
        if (partId === deviceId || fullPartId === deviceId) {
          try {
            const bounds = this.geometry.getPartBounds(viewType, componentId, partId);
            return { x: bounds.x + bounds.width / 2, y: bounds.y };
          } catch (e) {
            // Continue
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Berechnet X-Positionen für Pfadlabels basierend auf Wire-Routen
   */
  calculatePathPositions(paths, viewType) {
    const positions = [];
    const wirePrefix = viewType === 'DIN' ? 'din-' : 'lab-';
    
    for (const path of paths) {
      if (path.wires && path.wires.length > 0) {
        const firstWireId = path.wires[0];
        const wire = this.spec.wires.find(w => w.id === firstWireId);
        if (wire && wire.route && wire.route.length > 0) {
          const midPoint = Math.floor(wire.route.length / 2);
          positions.push({ x: wire.route[midPoint].x, y: 35 });
        }
      }
    }
    
    return positions;
  }
  
  /**
   * BASIS-LAYER: Geometrische Junctions an Wire-Kreuzungen
   */
  renderWireJunctions(viewType) {
    if (viewType !== 'DIN') return '';
    
    let svg = '';
    
    // Standard-Junctions aus Wire-Analyse (nur für geometrische Kreuzungen)
    const junctions = this.findJunctionPoints(viewType);
    for (const junction of junctions) {
      svg += `  <circle cx="${junction.x}" cy="${junction.y}" r="3" fill="#000"/>\n`;
    }
    
    return svg;
  }
  
  /**
   * Hilfsmethode: Ermittelt den Ausgangspunkt eines Devices
   */
  getDeviceOutputPosition(deviceId, viewType) {
    const anchorPrefix = viewType === 'DIN' ? 'DIN' : 'LAB';
    
    for (const [anchorId, anchor] of Object.entries(this.spec.anchors || {})) {
      if (anchor.component === deviceId && anchor.view === viewType) {
        if (anchor.terminal && (anchor.terminal.includes('OUT') || anchor.terminal.includes('22') || anchor.terminal.includes('14'))) {
          return { x: anchor.x, y: anchor.y };
        }
      }
    }
    
    const pos = this.getDevicePosition(deviceId, viewType);
    return pos ? { x: pos.x, y: pos.y + 25 } : null;
  }
  
  /**
   * Hilfsmethode: Ermittelt den Eingangspunkt eines Devices
   */
  getDeviceInputPosition(deviceId, viewType) {
    const anchorPrefix = viewType === 'DIN' ? 'DIN' : 'LAB';
    
    for (const [anchorId, anchor] of Object.entries(this.spec.anchors || {})) {
      if (anchor.component === deviceId && anchor.view === viewType) {
        if (anchor.terminal && (anchor.terminal.includes('IN') || anchor.terminal.includes('21') || anchor.terminal.includes('13') || anchor.terminal === 'A1')) {
          return { x: anchor.x, y: anchor.y };
        }
      }
    }
    
    const pos = this.getDevicePosition(deviceId, viewType);
    return pos ? { x: pos.x, y: pos.y } : null;
  }
  
  /**
   * Findet Abzweigungspunkte durch Analyse der Wire-Routen
   */
  findJunctionPoints(viewType) {
    const junctions = [];
    const wirePrefix = viewType === 'DIN' ? 'din-' : 'lab-';
    const wirePoints = new Map();
    
    // Sammle alle Punkte aller Wires
    for (const wire of this.spec.wires || []) {
      if (!wire.id.startsWith(wirePrefix)) continue;
      if (!wire.route) continue;
      
      for (const point of wire.route) {
        const key = `${point.x},${point.y}`;
        wirePoints.set(key, (wirePoints.get(key) || 0) + 1);
      }
    }
    
    // Punkte, die in mehr als einem Wire vorkommen = Abzweigungen
    for (const [key, count] of wirePoints.entries()) {
      if (count > 1) {
        const [x, y] = key.split(',').map(Number);
        junctions.push({ x, y });
      }
    }
    
    return junctions;
  }

  getInitialState() {
    const initialState = this.spec.states?.initial;
    if (!initialState) return {};
    
    const state = {};
    const componentStates = initialState.expected?.componentStates || {};
    for (const [componentId, compState] of Object.entries(componentStates)) {
      state[componentId] = compState;
    }
    
    return state;
  }

  renderWiresOld(viewType) {
    // Legacy wire rendering - aus Original übernommen
    let svg = '';
    const wirePrefix = viewType === 'DIN' ? 'din-wire' : 'lab-wire';
    
    for (const wire of this.spec.wires) {
      if (!wire.id.startsWith(wirePrefix)) continue;
      if (wire.route && wire.route.length >= 2) {
        for (let i = 0; i < wire.route.length - 1; i++) {
          const from = wire.route[i];
          const to = wire.route[i + 1];
          svg += '<line id="' + wire.id + '-seg' + i + '" class="wire ' + wire.type + '" ' +
                 'x1="' + from.x + '" y1="' + from.y + '" x2="' + to.x + '" y2="' + to.y + '" ' +
                 'stroke="' + (wire.color || '#000') + '" stroke-width="2"/>\n';
        }
      }
    }
    return svg;
  }

  /**
   * Generiert interaktive Controls aus den Triggers der Schaltung
   */
  generateInteractiveControls() {
    let controls = '';
    
    // Sammle alle verfuegbaren Triggers aus den States
    const triggers = new Set();
    if (this.spec.states) {
      for (const [stateId, state] of Object.entries(this.spec.states)) {
        if (state.transitions) {
          for (const transition of state.transitions) {
            if (transition.trigger) {
              triggers.add(transition.trigger);
            }
          }
        }
      }
    }
    
    // Erstelle Buttons fuer jeden Trigger
    const triggerArray = Array.from(triggers);
    for (const trigger of triggerArray) {
      const label = this.formatTriggerLabel(trigger);
      controls += `  <button class="trigger-btn" data-runtime-control="transition" data-trigger="${trigger}">${label}</button>\n`;
    }
    
    // Reset-Button
    controls += `  <button id="btn-reset" class="primary">RESET</button>\n`;
    
    return controls;
  }
  
  /**
   * Formatiert Trigger-Namen fuer Display
   */
  formatTriggerLabel(trigger) {
    return trigger
      .replace(/\./g, ' ')
      .replace(/pressed/g, 'DRUECKEN')
      .replace(/released/g, 'LOSLASSEN')
      .replace(/open/g, 'OEFFNEN')
      .replace(/close/g, 'SCHLIESSEN')
      .toUpperCase();
  }
  
  /**
   * Generiert das interaktive JavaScript
   */
  generateInteractiveScript() {
    const statesJson = JSON.stringify(this.spec.states || {});
    
    return `
const states = ${statesJson};
let currentStateId = 'initial';

function getCurrentState() {
  return states[currentStateId] || states[Object.keys(states)[0]];
}

function applyTrigger(trigger) {
  const current = getCurrentState();
  if (!current || !current.transitions) return false;
  
  const transition = current.transitions.find(t => t.trigger === trigger);
  if (transition) {
    currentStateId = transition.target;
    updateDisplay();
    return true;
  }
  return false;
}

function updateDisplay() {
  const stateDisplay = document.getElementById('state-display');
  if (stateDisplay) {
    stateDisplay.textContent = 'Status: ' + currentStateId;
  }

  window.currentState = currentStateId;
  document.body.setAttribute('data-runtime-state', currentStateId);

  animateStateChange();
}

function animateStateChange() {
  const state = getCurrentState();
  if (!state || !state.expected) return;
  
  // Animation fuer componentStates
  if (state.expected.componentStates) {
    for (const [componentId, compState] of Object.entries(state.expected.componentStates)) {
      animateComponent(componentId, compState);
    }
  }
}

function animateComponent(componentId, state) {
  const normalizedId = componentId.replace('AUX-NO', 'AUX').replace('AUX-NC', 'AUX');
  const dinElement = document.getElementById('din-' + normalizedId);
  const labElement = document.getElementById('labor-' + normalizedId);

  [dinElement, labElement].forEach(el => {
    if (el) {
      el.setAttribute('data-projected-state', state);
    }
  });

  // CSS-Animation fuer aktive Komponenten
  if (state === 'active' || state === 'closed' || state === 'lit') {
    [dinElement, labElement].forEach(el => {
      if (el) {
        el.style.transition = 'all 0.3s ease';
        el.style.filter = 'drop-shadow(0 0 8px #4caf50)';
        el.style.opacity = '1';
      }
    });
  } else {
    [dinElement, labElement].forEach(el => {
      if (el) {
        el.style.transition = 'all 0.3s ease';
        el.style.filter = 'none';
        el.style.opacity = '0.7';
      }
    });
  }
}

function reset() {
  currentStateId = 'initial';
  updateDisplay();
}

// Event-Listener fuer Trigger-Buttons
document.querySelectorAll('.trigger-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const trigger = btn.dataset.trigger;
    if (trigger) {
      applyTrigger(trigger);
    }
  });
});

// Reset-Button
document.getElementById('btn-reset').addEventListener('click', reset);

// Initial anzeigen
updateDisplay();
`;
  }
}

module.exports = { CircuitGeneratorV2 };
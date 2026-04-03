/**
 * StateEngine - Deklarative Zustandsmaschine
 * 
 * Keine hart codierte Zustandslogik.
 * Alle States, Transitions, Actions deklarativ aus Spec.
 */

class StateEngine {
  constructor(circuitSpec) {
    this.spec = circuitSpec;
    this.states = circuitSpec.states || {};
    this.currentStateId = this.findInitialState();
    this.resolvedState = {};
    this.mechanicalCouplings = this.buildCouplingGraph();
  }

  findInitialState() {
    for (const [id, state] of Object.entries(this.states)) {
      if (state.initial) return id;
    }
    return Object.keys(this.states)[0] || 'initial';
  }

  buildCouplingGraph() {
    const couplings = {};
    
    for (const [compId, component] of Object.entries(this.spec.components || {})) {
      for (const [partId, part] of Object.entries(component.parts || {})) {
        if (part.mechanicallyCoupledTo) {
          const target = part.mechanicallyCoupledTo;
          const sourceKey = `${compId}.${partId}`;
          couplings[sourceKey] = target;
        }
      }
    }
    
    return couplings;
  }

  getCurrentState() {
    return this.states[this.currentStateId];
  }

  getCurrentStateId() {
    return this.currentStateId;
  }

  /**
   * Trigger auf aktuellen State anwenden
   */
  applyTrigger(trigger) {
    const current = this.getCurrentState();
    if (!current || !current.transitions) return null;

    for (const transition of current.transitions) {
      if (transition.trigger === trigger) {
        return this.executeTransition(transition);
      }
    }
    
    return null;
  }

  /**
   * Transition ausführen
   */
  executeTransition(transition) {
    const oldStateId = this.currentStateId;
    this.currentStateId = transition.target;
    
    if (transition.actions) {
      this.applyActions(transition.actions);
    }
    
    this.resolveFullState();
    
    return {
      from: oldStateId,
      to: transition.target,
      actions: transition.actions || {}
    };
  }

  /**
   * Actions anwenden
   */
  applyActions(actions) {
    for (const [key, value] of Object.entries(actions)) {
      if (key.includes('.')) {
        const [component, property] = key.split('.');
        if (!this.resolvedState[component]) {
          this.resolvedState[component] = {};
        }
        this.resolvedState[component][property] = value;
      } else {
        this.resolvedState[key] = value;
      }
    }
  }

  /**
   * Vollständigen State auflösen inkl. mechanischer Kopplungen
   */
  resolveFullState() {
    const stateDef = this.getCurrentState();
    if (!stateDef || !stateDef.expected || !stateDef.expected.componentStates) {
      this.resolvedState = {};
      return this.resolvedState;
    }

    this.resolvedState = JSON.parse(JSON.stringify(stateDef.expected.componentStates));
    
    this.applyMechanicalCouplings();
    
    return this.resolvedState;
  }

  /**
   * Mechanische Kopplungen anwenden
   * z.B. coil.active -> aux.closed
   */
  applyMechanicalCouplings() {
    for (const [compId, component] of Object.entries(this.spec.components || {})) {
      const compState = this.resolvedState[compId];
      
      if (!compState) continue;
      
      for (const [partId, part] of Object.entries(component.parts || {})) {
        if (part.mechanicallyCoupledTo && part.type === 'aux_no') {
          const parentActive = compState === 'active' || compState === 'closed';
          const fullPartId = `${compId}-${partId}`;
          this.resolvedState[fullPartId] = parentActive ? 'closed' : 'open';
        }
        
        if (part.mechanicallyCoupledTo && part.type === 'aux_nc') {
          const parentActive = compState === 'active' || compState === 'closed';
          const fullPartId = `${compId}-${partId}`;
          this.resolvedState[fullPartId] = parentActive ? 'open' : 'closed';
        }
      }
    }
  }

  /**
   * State für spezifisches Part abrufen
   */
  getPartState(componentId, partId) {
    const fullId = `${componentId}-${partId}`;
    
    if (this.resolvedState[fullId] !== undefined) {
      return this.resolvedState[fullId];
    }
    
    if (this.resolvedState[componentId] !== undefined) {
      return this.resolvedState[componentId];
    }
    
    return null;
  }

  /**
   * State für spezifische Komponente abrufen
   */
  getComponentState(componentId) {
    return this.resolvedState[componentId] || null;
  }

  /**
   * Vollständigen resolved State abrufen
   */
  getFullState() {
    return { ...this.resolvedState };
  }

  /**
   * State resetten auf Initial
   */
  reset() {
    this.currentStateId = this.findInitialState();
    this.resolvedState = {};
    this.resolveFullState();
    return this.getFullState();
  }

  /**
   * State direkt setzen (für Tests)
   */
  setState(stateId) {
    if (this.states[stateId]) {
      this.currentStateId = stateId;
      this.resolveFullState();
      return this.getFullState();
    }
    return null;
  }
}

module.exports = { StateEngine };

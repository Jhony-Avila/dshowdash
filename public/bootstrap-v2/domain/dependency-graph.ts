// Dependency Graph
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.0-QUALITY: #23 Validação de dependências circulares com detecção de ciclo
// @changelog v1.1.0-ENTERPRISE: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: createDependencyGraph() factory returning:
//   addNode(), addEdge(), getDependencies(), getDependents(),
//   hasCycle(), detectCycle(), getCycleInfo(), validate(),
//   topologicalSort(), getExecutionOrder(), canExecute(),
//   setStatus(), getStatus(), getNode(), getAllNodes(), getReadyNodes(),
//   clear(), info()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'dependency-graph';
const VERSION = '1.2.1-CONTRACTS';

// Types
interface GraphNode {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath: string[];
  cycleString: string | null;
  detectedAt: number;
}

function createDependencyGraph() {
  let nodes: Record<string, GraphNode> = {};
  let edges: Record<string, string[]> = {};
  let _lastCycleDetected: CycleDetectionResult | null = null;

  function addNode(id: string, metadata?: Record<string, unknown>) {
    if (metadata === undefined) metadata = {};
    if (nodes[id]) return false;
    nodes[id] = Object.assign({ id: id, status: 'pending' }, metadata);
    edges[id] = [];
    return true;
  }

  function addEdge(from: string, to: string) {
    if (!nodes[from]) addNode(from);
    if (!nodes[to]) addNode(to);
    if (edges[from].indexOf(to) === -1) edges[from].push(to);
  }

  function getDependencies(id: string) {
    return edges[id] ? edges[id].slice() : [];
  }

  function getDependents(id: string) {
    const dependents = [];
    for (const nodeId in edges) {
      if (edges.hasOwnProperty(nodeId) && edges[nodeId].indexOf(id) !== -1) {
        dependents.push(nodeId);
      }
    }
    return dependents;
  }

  // #23: Detectar ciclo e retornar o caminho do ciclo
  function detectCycle() {
    const visited: Record<string, boolean> = {};
    const recursionStack: Record<string, boolean> = {};
    let cyclePath: string[] = [];
    let cycleFound = false;

    function dfs(node: string, path: string[]): boolean {
      if (cycleFound) return true;
      
      visited[node] = true;
      recursionStack[node] = true;
      path.push(node);

      const deps = edges[node] || [];
      for (let i = 0; i < deps.length; i++) {
        const dep = deps[i];
        if (!visited[dep]) {
          if (dfs(dep, path)) return true;
        } else if (recursionStack[dep]) {
          // Encontrou ciclo - extrair o caminho do ciclo
          const cycleStart = path.indexOf(dep);
          cyclePath = path.slice(cycleStart);
          cyclePath.push(dep); // Fechar o ciclo
          cycleFound = true;
          return true;
        }
      }

      path.pop();
      recursionStack[node] = false;
      return false;
    }

    for (const node in nodes) {
      if (nodes.hasOwnProperty(node) && !visited[node]) {
        if (dfs(node, [])) {
          _lastCycleDetected = {
            hasCycle: true,
            cyclePath: cyclePath,
            cycleString: cyclePath.join(' → '),
            detectedAt: Date.now()
          };
          return _lastCycleDetected;
        }
      }
    }

    _lastCycleDetected = {
      hasCycle: false,
      cyclePath: [],
      cycleString: null,
      detectedAt: Date.now()
    };
    return _lastCycleDetected;
  }

  function hasCycle() {
    return detectCycle().hasCycle;
  }

  // #23: Obter informações do último ciclo detectado
  function getCycleInfo() {
    if (!_lastCycleDetected) {
      detectCycle();
    }
    return _lastCycleDetected;
  }

  function topologicalSort() {
    const cycleInfo = detectCycle();
    if (cycleInfo.hasCycle) {
      throw new Error('Dependency graph has cycle: ' + cycleInfo.cycleString);
    }

    const visited: Record<string, boolean> = {};
    const result: string[] = [];

    function visit(node: string) {
      if (visited[node]) return;
      visited[node] = true;

      const deps = edges[node] || [];
      for (let i = 0; i < deps.length; i++) {
        visit(deps[i]);
      }

      result.push(node);
    }

    for (const node in nodes) {
      if (nodes.hasOwnProperty(node)) {
        visit(node);
      }
    }

    return result;
  }

  function getExecutionOrder() { return topologicalSort(); }

  function canExecute(id: string) {
    const deps = getDependencies(id);
    for (let i = 0; i < deps.length; i++) {
      const node = nodes[deps[i]];
      if (!node || node.status !== 'completed') return false;
    }
    return true;
  }

  function setStatus(id: string, status: string) {
    if (nodes[id]) {
      nodes[id].status = status;
      return true;
    }
    return false;
  }

  function getStatus(id: string) { return nodes[id] ? nodes[id].status : undefined; }
  function getNode(id: string) { return nodes[id]; }

  function getAllNodes() {
    const result = [];
    for (const id in nodes) {
      if (nodes.hasOwnProperty(id)) result.push(nodes[id]);
    }
    return result;
  }

  function getReadyNodes() {
    return getAllNodes().filter(function(node) {
      return node.status === 'pending' && canExecute(node.id);
    });
  }
  
  // #23: Validar grafo antes de usar
  function validate() {
    const cycleInfo = detectCycle();
    const errors: Array<{ type: string; message: string; cyclePath?: string[]; node?: string; missingDep?: string }> = [];
    const warnings: Array<{ type: string; message: string }> = [];
    
    if (cycleInfo.hasCycle) {
      errors.push({
        type: 'CIRCULAR_DEPENDENCY',
        message: 'Circular dependency detected: ' + cycleInfo.cycleString,
        cyclePath: cycleInfo.cyclePath
      });
    }
    
    // Verificar nós órfãos (sem dependentes e não são raiz)
    const nodeCount = Object.keys(nodes).length;
    if (nodeCount > 0) {
      for (const id in nodes) {
        if (nodes.hasOwnProperty(id)) {
          const deps = getDependencies(id);
          
          // Verificar dependências para nós inexistentes
          for (let i = 0; i < deps.length; i++) {
            if (!nodes[deps[i]]) {
              errors.push({
                type: 'MISSING_DEPENDENCY',
                message: 'Node "' + id + '" depends on non-existent node "' + deps[i] + '"',
                node: id,
                missingDep: deps[i]
              });
            }
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      nodeCount: nodeCount,
      edgeCount: Object.keys(edges).reduce(function(sum, k) { return sum + edges[k].length; }, 0),
      hasCycle: cycleInfo.hasCycle,
      cycleInfo: cycleInfo.hasCycle ? cycleInfo : null
    };
  }

  function clear() {
    nodes = {};
    edges = {};
    _lastCycleDetected = null;
  }

  function info() {
    let edgeCount = 0;
    for (const id in edges) {
      if (edges.hasOwnProperty(id)) edgeCount += edges[id].length;
    }
    const nodeCount = Object.keys(nodes).length;
    const cycleInfo = getCycleInfo();
    
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      nodeCount: nodeCount,
      edgeCount: edgeCount,
      hasCycle: cycleInfo!.hasCycle,
      cycleInfo: cycleInfo!.hasCycle ? cycleInfo : null,
      executionOrder: cycleInfo!.hasCycle ? [] : getExecutionOrder(),
      improvements: ['#23-CircularDependencyValidation']
    };
  }

  return {
    addNode: addNode,
    addEdge: addEdge,
    getDependencies: getDependencies,
    getDependents: getDependents,
    hasCycle: hasCycle,
    detectCycle: detectCycle,
    getCycleInfo: getCycleInfo,
    validate: validate,
    topologicalSort: topologicalSort,
    getExecutionOrder: getExecutionOrder,
    canExecute: canExecute,
    setStatus: setStatus,
    getStatus: getStatus,
    getNode: getNode,
    getAllNodes: getAllNodes,
    getReadyNodes: getReadyNodes,
    clear: clear,
    info: info
  };
}

export { createDependencyGraph, MODULE_ID, VERSION };
export default createDependencyGraph;

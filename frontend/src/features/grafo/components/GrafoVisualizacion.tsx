import { useCallback, useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { GrafoResponse, ForceNode, ForceLink, TipoNodo } from '../types/grafo.types';
import { NODE_COLORS } from './GrafoLeyenda';

interface GrafoVisualizacionProps {
  data: GrafoResponse;
  onNodeClick?: (nodo: ForceNode) => void;
  height?: number;
}

// Convertir datos del backend al formato de react-force-graph-2d
function transformarDatos(data: GrafoResponse): { nodes: ForceNode[]; links: ForceLink[] } {
  const nodes: ForceNode[] = data.nodos.map((nodo) => ({
    id: nodo.id,
    label: nodo.label,
    tipo: nodo.tipo as TipoNodo,
    propiedades: nodo.propiedades,
  }));

  const links: ForceLink[] = data.relaciones.map((rel) => ({
    source: rel.origen,
    target: rel.destino,
    tipo: rel.tipo,
    propiedades: rel.propiedades,
  }));

  return { nodes, links };
}

export function GrafoVisualizacion({ data, onNodeClick, height = 500 }: GrafoVisualizacionProps) {
  const graphRef = useRef<ForceGraphMethods<ForceNode, ForceLink>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });

  // Calcular dimensiones del contenedor
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Configurar fuerzas para mayor separacion
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge')?.strength(-200);
      graphRef.current.d3Force('link')?.distance(80);
    }
  }, [data]);

  // Centrar grafo despues de renderizar
  useEffect(() => {
    const timer = setTimeout(() => {
      if (graphRef.current) {
        graphRef.current.zoomToFit(400, 40);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [data]);

  const graphData = transformarDatos(data);

  // Renderizar nodo personalizado en canvas
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const tipo = node.tipo as TipoNodo;
    const color = NODE_COLORS[tipo] || '#999999';
    const label = node.label || '';
    const fontSize = 12 / globalScale;
    const nodeRadius = tipo === 'Pedido' ? 7 : tipo === 'Entrega' ? 6 : 5;

    // Dibujar circulo
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();

    // Dibujar etiqueta
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#374151';
    ctx.fillText(label, node.x, node.y + nodeRadius + 2 / globalScale);
  }, []);

  // Area de deteccion del puntero
  const paintNodeArea = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const tipo = node.tipo as TipoNodo;
    const nodeRadius = tipo === 'Pedido' ? 7 : tipo === 'Entrega' ? 6 : 5;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius + 2, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node as ForceNode);
    }
  }, [onNodeClick]);

  if (graphData.nodes.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full rounded-lg border border-piedra-200 bg-white overflow-hidden">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#ffffff"
        // Nodos
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={paintNodeArea}
        nodeLabel={(node: any) => {
          const tipo = node.tipo || '';
          const label = node.label || '';
          return `${tipo}: ${label}`;
        }}
        // Links
        linkColor={() => '#d1d5db'}
        linkWidth={1.5}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkLabel={(link: any) => link.tipo || ''}
        linkCurvature={0.1}
        // Interaccion
        onNodeClick={handleNodeClick}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        // Fisicas - mayor separacion entre nodos
        cooldownTicks={150}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
        d3AlphaMin={0.001}
        dagMode={undefined}
        warmupTicks={50}
      />
    </div>
  );
}

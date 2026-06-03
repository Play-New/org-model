/** The right-rail map: contracts and the nodes that keep them, with dependencies. */

import { Background, Controls, ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useT } from '../i18n';
import type { OrgModel } from '../orgmodel/model';
import { buildMap, parseFlowId } from '../orgmodel/mapview';
import type { ItemKind } from '../orgmodel/viewmodel';

interface MapPaneProps {
  model: OrgModel;
  selectedId: string | null;
  onPick: (kind: ItemKind, id: string) => void;
}

export function MapPane({ model, selectedId, onPick }: MapPaneProps) {
  const t = useT();
  const { nodes, edges } = buildMap(model);

  if (nodes.length === 0) {
    return <div className="pane__placeholder">{t('ws.mapEmpty')}</div>;
  }

  const rfNodes: Node[] = nodes.map(n => ({
    id: n.id,
    position: n.position,
    data: { label: n.data.label },
    className: [
      'mapnode',
      `mapnode--${n.data.kind}`,
      n.data.archetype ? `ori--${n.data.archetype}` : '',
      `st--${n.data.state}`,
      parseFlowId(n.id).id === selectedId ? 'is-selected' : '',
    ]
      .filter(Boolean)
      .join(' '),
  }));

  const rfEdges: Edge[] = edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    className: `mapedge mapedge--${e.kind}`,
    animated: e.kind === 'keeps',
  }));

  return (
    <div className="map">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        fitView
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, n) => {
          const s = parseFlowId(n.id);
          onPick(s.kind, s.id);
        }}
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
      <div className="map__legend">
        <span><i className="map__sw map__sw--core" /> core</span>
        <span><i className="map__sw map__sw--supporting" /> supporting</span>
        <span><i className="map__sw map__sw--platform" /> platform</span>
      </div>
    </div>
  );
}

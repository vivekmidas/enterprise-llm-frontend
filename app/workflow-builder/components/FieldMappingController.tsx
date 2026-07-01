'use client';

import type { Edge, Node } from '@xyflow/react';

import FieldMapperModal from '../../components/FieldMapperModal';
import type { NodeProperties, WorkflowNodeData } from '../types';

type FieldMappingControllerProps = {
  isOpen: boolean;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNode: Node<WorkflowNodeData> | null;
  sourceContract: any;
  targetContract: any;
  onClose: () => void;
  onUpdateNode: (nodeId: string, newData: any) => void;
  onSaveInstanceProperties: (nodeId: string, properties: NodeProperties) => Promise<void>;
  userRole?: string;
};

export default function FieldMappingController({
  isOpen,
  nodes,
  edges,
  selectedNode,
  sourceContract,
  targetContract,
  onClose,
  onUpdateNode,
  onSaveInstanceProperties,
  userRole,
}: FieldMappingControllerProps) {
  const isTransform =
    selectedNode?.data?.name === 'transform_node' ||
    String(selectedNode?.data?.node_type || '').toUpperCase() === 'TRANSFORM';

  const sourceNode = nodes.find(
    (node) => node.id === edges.find((edge) => edge.target === selectedNode?.id)?.source,
  );
  const targetNode = isTransform
    ? nodes.find(
        (node) => node.id === edges.find((edge) => edge.source === selectedNode?.id)?.target,
      )
    : selectedNode;

  const currentMapping = (() => {
    try {
      const val = (selectedNode?.data as any)?.properties?.mapping_template;
      return typeof val === 'string' ? JSON.parse(val) : val || {};
    } catch {
      return {};
    }
  })();

  return (
    <FieldMapperModal
      isOpen={isOpen}
      onClose={onClose}
      sourceNodeName={(sourceNode?.data as any)?.name}
      targetNodeName={(targetNode?.data as any)?.name}
      sourceContract={sourceContract}
      targetContract={targetContract}
      currentMapping={currentMapping}
      readOnly={false}
      onSaveMapping={async (newMap) => {
        if (!selectedNode) return;

        const mappingStr = JSON.stringify(newMap, null, 2);
        const updatedProperties = {
          ...(((selectedNode.data as any).properties as any) || {}),
          mapping_template: mappingStr,
        };

        onUpdateNode(selectedNode.id, {
          ...(selectedNode.data as any),
          properties: updatedProperties,
        });

        await onSaveInstanceProperties(selectedNode.id, updatedProperties);
        onClose();
      }}
    />
  );
}

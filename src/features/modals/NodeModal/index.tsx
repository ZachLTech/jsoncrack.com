import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { 
  Modal, 
  Stack, 
  Text, 
  ScrollArea, 
  Flex, 
  CloseButton, 
  Button, 
  TextInput, 
  Group,
  Divider 
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import toast from "react-hot-toast";
import type { NodeData, NodeRow } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

interface EditableRowProps {
  row: NodeRow;
  nodePath: (string | number)[];
  onSave: () => void;
  key?: string;
}

const EditableRow: React.FC<EditableRowProps> = ({ row, nodePath, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(row.value || ''));
  const updateNodeValue = useFile(state => state.updateNodeValue);

  // Update editValue when row.value changes (when the node data updates)
  React.useEffect(() => {
    setEditValue(String(row.value || ''));
  }, [row.value]);

  const canEdit = row.type !== "object" && row.type !== "array";

  const handleEdit = () => {
    setEditValue(String(row.value || ''));
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (row.key) {
        // For object properties
        const fullPath = [...nodePath, row.key];
        await updateNodeValue(fullPath, editValue);
      } else {
        // For primitive values (single values)
        await updateNodeValue(nodePath, editValue);
      }
      
      setIsEditing(false);
      onSave();
      toast.success("Node value updated successfully");
    } catch (error) {
      toast.error("Failed to update node value");
    }
  };

  const handleCancel = () => {
    setEditValue(String(row.value || ''));
    setIsEditing(false);
  };

  const getDisplayValue = () => {
    if (row.type === "object") return `{${row.childrenCount ?? 0} keys}`;
    if (row.type === "array") return `[${row.childrenCount ?? 0} items]`;
    return String(row.value);
  };

  return (
    <Flex direction="column" gap="xs" p="xs" style={{ borderBottom: "1px solid #eee" }}>
      <Flex align="center" justify="space-between">
        <Text size="sm" fw={500}>
          {row.key ? `${row.key}:` : "Value:"}
        </Text>
        {canEdit && !isEditing && (
          <Button size="xs" variant="light" onClick={handleEdit}>
            Edit
          </Button>
        )}
      </Flex>
      
      {isEditing ? (
        <Stack gap="xs">
          <TextInput
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter new value..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <Group gap="xs">
            <Button size="xs" color="green" onClick={handleSave}>
              Save
            </Button>
            <Button size="xs" color="red" variant="light" onClick={handleCancel}>
              Cancel
            </Button>
          </Group>
        </Stack>
      ) : (
        <Text size="sm" c="dimmed" style={{ fontFamily: "monospace" }}>
          {getDisplayValue()}
        </Text>
      )}
    </Flex>
  );
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const nodes = useGraph(state => state.nodes);
  
  // Get the most current node data by finding it in the current nodes array
  const currentNodeData = React.useMemo(() => {
    if (!nodeData) return null;
    
    // Find the updated node in the current nodes array by matching path and structure
    const updatedNode = nodes.find(node => {
      // Match by path if available
      if (node.path && nodeData.path) {
        return JSON.stringify(node.path) === JSON.stringify(nodeData.path);
      }
      // Fallback to ID matching
      return node.id === nodeData.id;
    });
    
    // If we found an updated node, update the selected node reference
    if (updatedNode && updatedNode !== nodeData) {
      // Update the selected node so future renders use the new data
      setTimeout(() => setSelectedNode(updatedNode), 0);
      return updatedNode;
    }
    
    return nodeData;
  }, [nodeData, nodes, setSelectedNode]);

  const handleSave = () => {
    // The useMemo above will automatically detect changes and update currentNodeData
    // No explicit refresh needed as the effect will trigger when nodes array updates
  };

  const canEditAnyValue = currentNodeData?.text?.some(row => 
    row.type !== "object" && row.type !== "array"
  );

  return (
    <Modal size="lg" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Flex justify="space-between" align="center">
          <Text fz="lg" fw={600}>
            Node Details
          </Text>
          <CloseButton onClick={onClose} />
        </Flex>

        {/* Editable Values Section */}
        {canEditAnyValue && (
          <Stack gap="xs">
            <Text fz="sm" fw={500}>
              Editable Values
            </Text>
            <Stack gap={0} style={{ border: "1px solid #eee", borderRadius: "4px" }}>
              {currentNodeData?.text?.map((row, index) => {
                const canEdit = row.type !== "object" && row.type !== "array";
                if (!canEdit) return null;
                
                return (
                  <EditableRow
                    key={`${currentNodeData.id}-${index}-${Date.now()}`}
                    row={row}
                    nodePath={currentNodeData.path || []}
                    onSave={handleSave}
                  />
                );
              })}
            </Stack>
          </Stack>
        )}

        <Divider />

        {/* Content Section */}
        <Stack gap="xs">
          <Text fz="sm" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight
              code={normalizeNodeData(currentNodeData?.text ?? [])}
              miw={350}
              maw={600}
              language="json"
              withCopyButton
            />
          </ScrollArea.Autosize>
        </Stack>

        {/* JSON Path Section */}
        <Stack gap="xs">
          <Text fz="sm" fw={500}>
            JSON Path
          </Text>
          <ScrollArea.Autosize maw={600}>
            <CodeHighlight
              code={jsonPathToString(currentNodeData?.path)}
              miw={350}
              mah={100}
              language="json"
              copyLabel="Copy to clipboard"
              copiedLabel="Copied to clipboard"
              withCopyButton
            />
          </ScrollArea.Autosize>
        </Stack>
      </Stack>
    </Modal>
  );
};

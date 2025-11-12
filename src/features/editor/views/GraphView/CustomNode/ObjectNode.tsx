import React from "react";
import styled from "styled-components";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import { useNodeEditor } from "../../../../../hooks/useNodeEditor";
import useFile from "../../../../../store/useFile";
import type { NodeData } from "../../../../../types/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";

const StyledEditContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

const StyledEditInput = styled.input`
  background: ${({ theme }) => theme.BACKGROUND_PRIMARY};
  border: 2px solid ${({ theme }) => theme.TEXT_POSITIVE};
  color: ${({ theme }) => theme.NODE_COLORS.TEXT};
  font-family: monospace;
  font-size: 12px;
  font-weight: 500;
  padding: 1px 4px;
  border-radius: 3px;
  flex: 1;
  outline: none;
`;

const StyledButtonContainer = styled.div`
  display: flex;
  gap: 2px;
  margin-left: 4px;
`;

const StyledButton = styled.button<{ $variant?: 'save' | 'cancel' }>`
  background: ${({ theme, $variant }) => 
    $variant === 'save' ? theme.TEXT_POSITIVE : 
    $variant === 'cancel' ? theme.TEXT_DANGER : 
    theme.INTERACTIVE_NORMAL};
  color: white;
  border: none;
  border-radius: 2px;
  padding: 1px 4px;
  font-size: 9px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    opacity: 0.8;
  }
`;

const StyledEditButton = styled.button`
  background: ${({ theme }) => theme.INTERACTIVE_NORMAL};
  color: white;
  border: none;
  border-radius: 2px;
  padding: 1px 4px;
  font-size: 9px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  font-weight: 500;
  margin-left: 4px;
  
  &:hover {
    background: ${({ theme }) => theme.INTERACTIVE_ACTIVE};
  }
`;

const StyledRowContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  
  &:hover ${StyledEditButton} {
    opacity: 1;
  }
`;

const StyledRowContent = styled.div`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type RowProps = {
  row: NodeData["text"][number];
  x: number;
  y: number;
  index: number;
  nodeId: string;
  nodePath?: (string | number)[];
};

const Row = ({ row, x, y, index, nodeId, nodePath }: RowProps) => {
  const rowPosition = index * NODE_DIMENSIONS.ROW_HEIGHT;
  const updateNodeValue = useFile(state => state.updateNodeValue);
  
  const {
    isEditing,
    startEdit,
    updateEditValue,
    cancelEdit,
    getEditValue,
    hasChanges,
  } = useNodeEditor();

  const getRowText = () => {
    if (row.type === "object") return `{${row.childrenCount ?? 0} keys}`;
    if (row.type === "array") return `[${row.childrenCount ?? 0} items]`;
    return row.value;
  };

  const canEdit = row.type !== "object" && row.type !== "array" && row.key && nodePath && nodePath.length >= 0;

  const handleEditClick = () => {
    if (canEdit) {
      startEdit(nodeId, String(row.value), index);
    }
  };

  const handleSave = async () => {
    if (hasChanges() && canEdit && nodePath && nodePath.length >= 0 && row.key) {
      const fullPath = [...nodePath, row.key];
      await updateNodeValue(fullPath, getEditValue());
    }
    cancelEdit();
  };

  const handleCancel = () => {
    cancelEdit();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateEditValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Styled.StyledRow
      $value={row.value}
      data-key={`${row.key}: ${row.value}`}
      data-x={x}
      data-y={y + rowPosition}
    >
      <StyledRowContainer>
        <Styled.StyledKey $type="object">{row.key}: </Styled.StyledKey>
        {isEditing(nodeId, index) ? (
          <StyledEditContainer>
            <StyledEditInput
              type="text"
              value={getEditValue()}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <StyledButtonContainer>
              <StyledButton $variant="save" onClick={handleSave}>
                Save
              </StyledButton>
              <StyledButton $variant="cancel" onClick={handleCancel}>
                Cancel
              </StyledButton>
            </StyledButtonContainer>
          </StyledEditContainer>
        ) : (
          <>
            <StyledRowContent>
              <TextRenderer>{getRowText()}</TextRenderer>
            </StyledRowContent>
            {canEdit && (
              <StyledEditButton onClick={handleEditClick}>
                Edit
              </StyledEditButton>
            )}
          </>
        )}
      </StyledRowContainer>
    </Styled.StyledRow>
  );
};

const Node = ({ node, x, y }: CustomNodeProps) => (
  <Styled.StyledForeignObject
    data-id={`node-${node.id}`}
    width={node.width}
    height={node.height}
    x={0}
    y={0}
    $isObject
  >
    {node.text.map((row, index) => (
      <Row 
        key={`${node.id}-${index}`} 
        row={row} 
        x={x} 
        y={y} 
        index={index} 
        nodeId={node.id}
        nodePath={node.path}
      />
    ))}
  </Styled.StyledForeignObject>
);

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return (
    JSON.stringify(prev.node.text) === JSON.stringify(next.node.text) &&
    prev.node.width === next.node.width
  );
}

export const ObjectNode = React.memo(Node, propsAreEqual);

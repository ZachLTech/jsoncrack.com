import React from "react";
import styled from "styled-components";
import type { CustomNodeProps } from ".";
import { useNodeEditor } from "../../../../../hooks/useNodeEditor";
import useConfig from "../../../../../store/useConfig";
import useFile from "../../../../../store/useFile";
import { isContentImage } from "../lib/utils/calculateNodeSize";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";

const StyledTextNodeWrapper = styled.span<{ $isParent: boolean }>`
  display: flex;
  justify-content: ${({ $isParent }) => ($isParent ? "center" : "flex-start")};
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 0 10px;
  position: relative;
`;

const StyledImageWrapper = styled.div`
  padding: 5px;
`;

const StyledImage = styled.img`
  border-radius: 2px;
  object-fit: contain;
  background: ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
`;

const StyledEditContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const StyledEditInput = styled.input`
  background: ${({ theme }) => theme.BACKGROUND_PRIMARY};
  border: 2px solid ${({ theme }) => theme.TEXT_POSITIVE};
  color: ${({ theme }) => theme.NODE_COLORS.TEXT};
  font-family: monospace;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 4px;
  border-radius: 3px;
  width: 100%;
  outline: none;
`;

const StyledButtonContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-left: 8px;
`;

const StyledButton = styled.button<{ $variant?: 'save' | 'cancel' }>`
  background: ${({ theme, $variant }) => 
    $variant === 'save' ? theme.TEXT_POSITIVE : 
    $variant === 'cancel' ? theme.TEXT_DANGER : 
    theme.INTERACTIVE_NORMAL};
  color: white;
  border: none;
  border-radius: 2px;
  padding: 2px 6px;
  font-size: 10px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    opacity: 0.8;
  }
`;

const StyledEditButton = styled.button`
  position: absolute;
  right: -25px;
  top: 50%;
  transform: translateY(-50%);
  background: ${({ theme }) => theme.INTERACTIVE_NORMAL};
  color: white;
  border: none;
  border-radius: 2px;
  padding: 2px 6px;
  font-size: 10px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  font-weight: 500;
  
  &:hover {
    background: ${({ theme }) => theme.INTERACTIVE_ACTIVE};
  }
`;

const StyledNodeContent = styled.div`
  width: 100%;
  position: relative;
  
  &:hover ${StyledEditButton} {
    opacity: 1;
  }
`;

const Node = ({ node, x, y }: CustomNodeProps) => {
  const { text, width, height, path } = node;
  const imagePreviewEnabled = useConfig(state => state.imagePreviewEnabled);
  const isImage = imagePreviewEnabled && isContentImage(JSON.stringify(text[0].value));
  const value = text[0].value;
  const updateNodeValue = useFile(state => state.updateNodeValue);
  
  const {
    isEditing,
    startEdit,
    updateEditValue,
    cancelEdit,
    getEditValue,
    hasChanges,
  } = useNodeEditor();

  const handleEditClick = () => {
    startEdit(node.id, String(value));
  };

  const handleSave = async () => {
    if (hasChanges() && path && path.length > 0) {
      await updateNodeValue(path, getEditValue());
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
    <Styled.StyledForeignObject
      data-id={`node-${node.id}`}
      width={width}
      height={height}
      x={0}
      y={0}
    >
      {isImage ? (
        <StyledImageWrapper>
          <StyledImage src={JSON.stringify(text[0].value)} width="70" height="70" loading="lazy" />
        </StyledImageWrapper>
      ) : (
        <StyledTextNodeWrapper
          data-x={x}
          data-y={y}
          data-key={JSON.stringify(text)}
          $isParent={false}
        >
          <StyledNodeContent>
            {isEditing(node.id) ? (
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
                <Styled.StyledKey $value={value} $type={typeof text[0].value}>
                  <TextRenderer>{value}</TextRenderer>
                </Styled.StyledKey>
                <StyledEditButton onClick={handleEditClick}>
                  Edit
                </StyledEditButton>
              </>
            )}
          </StyledNodeContent>
        </StyledTextNodeWrapper>
      )}
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return prev.node.text === next.node.text && prev.node.width === next.node.width;
}

export const TextNode = React.memo(Node, propsAreEqual);

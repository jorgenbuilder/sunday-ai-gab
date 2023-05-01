// dialogue.ts

import {
  Choice,
  Condition,
  Dialogue,
  DialogueInstance,
  DialogueNode,
  UserAction,
} from "./types";
import { validateJSON } from "./validator";

export const loadDialogue = (jsonText: string): Dialogue => {
  const validation = validateJSON(jsonText);
  if (validation.errors) {
    throw new Error(`Invalid dialogue: ${validation.errors}`);
  }
  const dialogueData: Dialogue = JSON.parse(jsonText);
  return dialogueData;
};

export const getCurrentNode = (
  dialogueInstance: DialogueInstance
): DialogueNode => {
  const { dialogue, history } = dialogueInstance;
  let currentNode: DialogueNode = dialogue.nodes.find(
    (node) => node.id === "start"
  )!;

  for (const choiceTextId of history) {
    if (!currentNode.goto && !currentNode.choices && currentNode.id !== "end") {
      throw new Error("Couldn't find next node.");
    }

    const selectedChoice = currentNode.choices?.find(
      (choice) => choice.text_id === choiceTextId
    );

    if (!selectedChoice && !currentNode.goto) {
      throw new Error("Couldn't find next node.");
    }

    currentNode = dialogue.nodes.find(
      (node) =>
        node.id === selectedChoice?.target || node.id === currentNode.goto
    )!;
  }

  return currentNode;
};

const checkCondition = (condition: Condition, history: string[]): boolean => {
  const { variable, comparison, value } = condition;
  const occurrences = history.filter((item) => item === variable).length;

  switch (comparison) {
    case "equal":
      return occurrences === value;
    case "not_equal":
      return occurrences !== value;
    case "greater_than":
      return occurrences > value;
    case "less_than":
      return occurrences < value;
    case "greater_than_or_equal":
      return occurrences >= value;
    case "less_than_or_equal":
      return occurrences <= value;
    default:
      throw new Error(
        `Invalid comparison operator "${comparison}" in condition.`
      );
  }
};

export const getAvailableChoices = (
  node: DialogueNode,
  history: string[]
): Choice[] => {
  if (!node.choices) {
    return [];
  }

  return node.choices.filter((choice) => {
    if (!choice.conditions) {
      return true;
    }

    return choice.conditions.every((condition) =>
      checkCondition(condition, history)
    );
  });
};

export const applyAction = (
  userAction: UserAction,
  dialogue: Dialogue,
  history: string[]
): { updatedHistory: string[]; nextNodeId: string } => {
  const currentNode = getCurrentNode({ dialogue, history });

  if (!currentNode.choices && !currentNode.goto) {
    throw new Error("No choices available in the current node.");
  }

  const selectedChoice =
    currentNode.goto && userAction.type === "goto"
      ? currentNode.goto
      : currentNode.choices?.find(
          (choice) => choice.text_id === userAction.type
        )?.target;

  if (!selectedChoice) {
    throw new Error(
      `Invalid user action: "${
        userAction.type
      }" not found in the available choices (${currentNode.choices
        ?.map((x) => `${x.text_id} -> ${x.target}`)
        .join(", ")}).`
    );
  }

  const updatedHistory = [...history, userAction.type];
  return {
    updatedHistory,
    nextNodeId: selectedChoice,
  };
};

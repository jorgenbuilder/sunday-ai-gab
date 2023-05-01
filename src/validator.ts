import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";
import schema from "../schema.json";
import { Dialogue, DialogueInstance, UserAction } from "./types";
import { applyAction, loadDialogue } from "./dialogue";

export const validateJSONFile = (
  jsonFile: string
): { valid: boolean; errors: null | ErrorObject[] } => {
  return validateJSON(fs.readFileSync(jsonFile, "utf8"));
};

export const validateJSON = (
  json: string
): { valid: boolean; errors: null | ErrorObject[] } => {
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const jsonData = JSON.parse(json);
  const valid = validate(jsonData);

  return {
    valid: !!valid,
    // @ts-ignore
    errors: validate.errors,
  };
};

function findAllPaths(dialogue: Dialogue, maxDepth: number = 50): string[][] {
  const paths: string[][] = [];

  function dfs(
    nodeId: string,
    path: string[] = [],
    depth: number = 0,
    visitedChoices: Set<string> = new Set()
  ): void {
    console.log(`Visiting node "${nodeId}" from "${path.join(" -> ")}"`);
    if (depth > maxDepth) {
      console.warn(
        `Reached maximum depth (${maxDepth}) for path "${path.join(
          " -> "
        )}". Stopping recursion.`
      );
      return;
    }

    const node = dialogue.nodes.find((node) => node.id === nodeId);
    if (!node) {
      throw new Error(`Node with ID "${nodeId}" not found in the dialogue.`);
    }

    if (node.choices) {
      node.choices.forEach((choice) => {
        const choiceKey = `${nodeId}-${choice.text_id}`;
        if (!visitedChoices.has(choiceKey)) {
          visitedChoices.add(choiceKey);
          dfs(
            choice.target,
            [...path, choice.text_id],
            depth + 1,
            new Set(visitedChoices)
          );
        }
      });
    } else if (node.id === "end") {
      paths.push(path);
    } else if (node.goto) {
      dfs(node.goto, [...path, "goto"], depth + 1, new Set(visitedChoices));
    } else {
      throw new Error(
        `Node "${nodeId}" of ${dialogue.metadata.title} has no way to proceed. It should be marked as an end state.`
      );
    }
  }

  dfs("start");
  return paths;
}

export function testAllPaths(dialogueJson: string): void {
  const dialogue = loadDialogue(dialogueJson);
  const allPaths = findAllPaths(dialogue);
  console.log(`Found ${allPaths.length} paths in ${dialogue.metadata.title}`);

  allPaths.forEach((path, index) => {
    console.log(
      `Testing path ${index + 1} of ${allPaths.length}: ${path.join(" -> ")} (${
        dialogue.metadata.title
      })`
    );

    const dialogueInstance: DialogueInstance = {
      history: [],
      dialogue,
    };

    let currentNodeId = "start";
    path.forEach((actionId) => {
      const userAction: UserAction = {
        type: actionId,
        value: null,
      };

      const { updatedHistory, nextNodeId } = applyAction(
        userAction,
        dialogue,
        dialogueInstance.history
      );
      dialogueInstance.history = updatedHistory;
      currentNodeId = nextNodeId;
    });

    if (currentNodeId !== "end") {
      throw new Error(`Path ${index + 1} did not reach the end state.`);
    }
  });
}

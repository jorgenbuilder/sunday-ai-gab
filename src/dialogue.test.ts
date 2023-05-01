import fs from "fs";
import {
  loadDialogue,
  getCurrentNode,
  getAvailableChoices,
  applyAction,
} from "./dialogue";
import { DialogueInstance, UserAction } from "./types";
import path from "path";

const JSON_DIR = path.join(__dirname, "../json-scripts/test.json");

describe("Dialogue core functions", () => {
  const exampleDialogueJSON = fs.readFileSync(JSON_DIR, "utf8");
  const dialogue = loadDialogue(exampleDialogueJSON);
  const dialogueInstance: DialogueInstance = {
    dialogue,
    history: [],
  };

  test("Load dialogue", () => {
    expect(dialogue).toBeDefined();
    expect(dialogue.nodes.length).toBeGreaterThan(0);
  });

  test("Get current node", () => {
    const currentNode = getCurrentNode(dialogueInstance);
    expect(currentNode.id).toEqual("start");
  });

  test("Get available choices", () => {
    const currentNode = getCurrentNode(dialogueInstance);
    const availableChoices = getAvailableChoices(
      currentNode,
      dialogueInstance.history
    );

    expect(availableChoices.length).toEqual(1);
    expect(availableChoices[0].text_id).toEqual("approach_barkeep");
  });

  test("Apply user action and update history", () => {
    const userAction: UserAction = {
      type: "approach_barkeep",
      value: null,
    };

    const { updatedHistory, nextNodeId } = applyAction(
      userAction,
      dialogue,
      dialogueInstance.history
    );

    expect(updatedHistory).toEqual(["approach_barkeep"]);
    expect(nextNodeId).toEqual("barkeep_greeting");
  });

  test("Full conversation flow", () => {
    const actions = ["approach_barkeep", "ask_about_adventures", "listen"];

    let history: string[] = [];
    let currentNodeId = "start";

    actions.forEach((action) => {
      const userAction: UserAction = {
        type: action,
        value: null,
      };

      const { updatedHistory, nextNodeId } = applyAction(
        userAction,
        dialogue,
        history
      );
      history = updatedHistory;
      currentNodeId = nextNodeId;
    });

    expect(history).toEqual(actions);
    expect(currentNodeId).toEqual("end");
  });
});

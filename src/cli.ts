import { Command } from "commander";
const chalk = require("chalk");
import readline from "readline";
import fs from "fs";

import {
  loadDialogue,
  getCurrentNode,
  getAvailableChoices,
  applyAction,
} from "./dialogue";

import { DialogueInstance } from "./types";

const program = new Command();

// Utility function to display available choices and prompt the user for input
async function prompt(
  choices: ReturnType<typeof getAvailableChoices> | string
): Promise<number> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (choices instanceof Array) {
      choices.forEach((choice, index) => {
        console.log(chalk.yellow(`[${index + 1}] ${choice.text}`));
      });
      rl.question(chalk.green("Choose an option: "), (answer) => {
        rl.close();
        resolve(parseInt(answer, 10) - 1);
      });
    } else {
      rl.question(chalk.green("Press enter to continue... "), (answer) => {
        rl.close();
        resolve(0);
      });
    }
  });
}

async function playDialogue(dialogueJson: string) {
  const dialogue = loadDialogue(dialogueJson);
  const dialogueInstance: DialogueInstance = {
    dialogue,
    history: [],
  };

  let currentNode = getCurrentNode(dialogueInstance);

  while (currentNode.id !== "end") {
    currentNode.character &&
      console.log(
        chalk.blue(chalk.bold(`${currentNode.character.toLocaleUpperCase()}: `))
      );
    console.log(chalk.blue(currentNode.text));

    const availableChoices = getAvailableChoices(
      currentNode,
      dialogueInstance.history
    );

    if (availableChoices.length === 0 && currentNode.goto) {
      await prompt("");
      const { updatedHistory } = applyAction(
        { type: "goto", value: null },
        dialogue,
        dialogueInstance.history
      );
      dialogueInstance.history = updatedHistory;
    } else {
      const choiceIndex = await prompt(availableChoices);

      const userAction = {
        type: availableChoices[choiceIndex].text_id,
        value: null,
      };

      const { updatedHistory } = applyAction(
        userAction,
        dialogue,
        dialogueInstance.history
      );
      dialogueInstance.history = updatedHistory;
    }

    currentNode = getCurrentNode(dialogueInstance);
  }
  // Print the last node
  currentNode.text && console.log(chalk.blue(currentNode.text));
  console.log(chalk.red("The dialogue has reached its end state."));
  console.log(
    chalk.red(
      `Path of dialogue options taken: ${dialogueInstance.history.join(" -> ")}`
    )
  );
}

program
  .version("1.0.0")
  .description("Interactive dialogue CLI")
  .arguments("<dialogueFile>")
  .action((dialogueFile) => {
    const dialogueJson = fs.readFileSync(dialogueFile, "utf-8");
    playDialogue(dialogueJson).catch((err) => {
      console.error(chalk.red("Error:", err.message));
      process.exit(1);
    });
  })
  .parse(process.argv);

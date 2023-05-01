// Types for the JSON schema
export type Character = {
  id: string;
  name: string;
  portrait?: string;
};

export type Localization = {
  [lang: string]: {
    language: string;
    translations: {
      [key: string]: string;
    };
  };
};

export type Condition = {
  variable: string;
  comparison: string;
  value: any;
};

export type Action = {
  type: string;
  variable: string;
  value: any;
};

export type Choice = {
  text_id: string;
  text: string;
  target: string;
  conditions?: Condition[];
};

export type DialogueNode = {
  id: string;
  character?: string;
  text_id?: string;
  text?: string;
  choices?: Choice[];
  actions?: Action[];
  conditions?: Condition[];
  goto?: string;
};

export type Dialogue = {
  metadata: {
    title: string;
    author: string;
    version: string;
    language: string;
  };
  characters: Character[];
  localization: Localization;
  nodes: DialogueNode[];
};

// Core module interfaces
export interface DialogueInstance {
  dialogue: Dialogue;
  history: string[];
}

export type UserAction = {
  type: string;
  value: any;
};

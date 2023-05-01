import path from "path";
import fs from "fs";
import { testAllPaths, validateJSONFile } from "./validator";

const JSON_DIR = path.join(__dirname, "../json-scripts");

describe("JSON schema validation", () => {
  const jsonFiles = fs
    .readdirSync(JSON_DIR)
    .filter((file) => file.endsWith(".json"));

  jsonFiles.forEach((file) => {
    console.log(`Testing ${file}`);
    it(`should validate ${file}`, () => {
      const filePath = path.join(JSON_DIR, file);
      const { valid, errors } = validateJSONFile(filePath);
      if (!valid) console.error(errors);
      expect(valid).toBe(true);
      expect(errors).toBeNull();
    });

    it(`should test all paths in ${file}`, () => {
      const filePath = path.join(JSON_DIR, file);
      const json = fs.readFileSync(filePath, "utf8");
      const { valid, errors } = validateJSONFile(filePath);
      testAllPaths(json);
    });
  });
});

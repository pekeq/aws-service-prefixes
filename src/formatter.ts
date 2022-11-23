import { Command } from "commander";
import * as fs from "fs/promises";
import _ from "lodash";

async function main() {
  const program = new Command();
  program
    .option("-i, --input <file>", "Input filename", "data/aws-services.json")
    .option("-o, --output <file>", "Output directory", "public/index.html")
    .option("-t, --template <file>", "HTML template file", "src/template.html");
  program.parse();
  const options = program.opts();

  const content = await fs.readFile(options.input);
  const services = JSON.parse(content.toString());

  const template = await fs.readFile(options.template);
  const compiled = _.template(template.toString());
  const html = compiled({ services });
  await fs.writeFile(options.output, html);
}

await main();

import { Command } from "commander";
import * as fs from "fs/promises";
import _ from "lodash";
import { minify } from "html-minifier";

async function main() {
  const program = new Command();
  program
    .option("-i, --input <file>", "Input filename", "data/aws-services.json")
    .option("-o, --output <file>", "Output directory", "public/index.html")
    .option("-t, --template <file>", "HTML template file", "src/template.html")
    .option("-m, --minify", "Minify HTML");
  program.parse();
  const options = program.opts();

  const content = await fs.readFile(options.input);
  const services = JSON.parse(content.toString());

  const template = await fs.readFile(options.template);
  const compiled = _.template(template.toString());
  let html = compiled({ services });

  if (options.minify) {
    html = minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
    });
  }

  await fs.writeFile(options.output, html);
}

await main();

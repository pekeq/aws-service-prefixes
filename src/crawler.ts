import { Command } from "commander";
import * as cheerio from "cheerio";
import * as fs from "fs/promises";

export interface Service {
  name: string;
  prefix: string;
  url: string;
}

async function getServicePrefix(pageUrl: string): Promise<string> {
  console.debug(`fetch: ${pageUrl}`);
  const response = await fetch(pageUrl);
  if (!response.ok) {
    const responseText = await response.text();
    console.error(
      `fetch: ${response.status} ${response.statusText}: ${responseText}: ${pageUrl}`
    );
    process.exit(1);
  }

  const $ = cheerio.load(await response.text());

  const prefixDiv = $("p:contains('service prefix:')");
  const prefix = prefixDiv.find("code").first().text();

  return prefix;
}

export async function crawlServicePrefixIndex(
  pageUrl: string
): Promise<Service[]> {
  const response = await fetch(pageUrl);
  if (!response.ok) {
    const responseText = await response.text();
    console.error(
      `fetch: ${response.status} ${response.statusText}: ${responseText}: ${pageUrl}`
    );
    process.exit(1);
  }

  const $ = cheerio.load(await response.text());

  const topicsDiv = $("#context_keys_table ~ :contains('Topics')");
  const services = topicsDiv.find("li");

  const promices = services.map(async (i, _el): Promise<Service> => {
    const el = $(_el);
    const name = el.text();
    const href = el.find("a").attr("href");
    const serviceUrl = new URL(href!, pageUrl).href;
    const prefix = await getServicePrefix(serviceUrl);
    return { name, prefix, url: serviceUrl };
  });

  const prefixes = await Promise.all(promices);

  return prefixes;
}

async function main() {
  const program = new Command();
  program
    .option(
      "-s, --start <url>",
      "URL for crawl starting point",
      "https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html"
    )
    .option("-o, --output <file>", "Output filename", "data/aws-services.json");
  program.parse();
  const options = program.opts();

  const prefixes = await crawlServicePrefixIndex(options.start);

  console.info(`writing ${options.output}...`);
  await fs.writeFile(options.output, JSON.stringify(prefixes, null, 2));
}

await main();

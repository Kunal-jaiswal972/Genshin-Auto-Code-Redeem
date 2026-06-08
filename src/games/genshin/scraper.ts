import axios from "axios";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { ScrapeError } from "../../core/errors.js";
import type { ScrapedCodeRow } from "../../types/games.js";
import { genshinConfig } from "./config.js";

interface FandomWikiError {
  code?: string;
  info?: string;
}

interface FandomParseResponse {
  parse?: {
    text?: {
      "*": string;
    };
  };
  error?: FandomWikiError;
}

const WIKI_USER_AGENT =
  "GenshinAutoCodeRedeem/2.0 (https://github.com; wiki scraper)";

function extractCodesFromRow(row: Element, $: cheerio.CheerioAPI): string[] {
  return $(row)
    .find(genshinConfig.selectors.codeLink)
    .map((_, link) => $(link).find(genshinConfig.selectors.codeText).text().trim())
    .get()
    .filter((code) => code.length > 0);
}

function isRowExpired(row: Element, $: cheerio.CheerioAPI): boolean {
  const style = $(row).find("td:last-child").attr("style") ?? "";
  return !style.includes(genshinConfig.selectors.activeRowStyle);
}

function parseCodeRows(html: string): ScrapedCodeRow[] {
  const $ = cheerio.load(html);
  const rows = $(genshinConfig.selectors.codeTableRows);

  return rows
    .map((_, row) => {
      const codes = extractCodesFromRow(row, $);

      return {
        codes,
        expired: isRowExpired(row, $),
      };
    })
    .get()
    .filter((entry) => entry.codes.length > 0);
}

async function fetchWikiHtml(): Promise<string> {
  const response = await axios.get<FandomParseResponse>(genshinConfig.wikiApiUrl, {
    params: {
      action: "parse",
      page: genshinConfig.wikiPageTitle,
      format: "json",
      prop: "text",
    },
    responseType: "json",
    timeout: 30_000,
    headers: {
      "User-Agent": WIKI_USER_AGENT,
    },
    validateStatus: (status) => status >= 200 && status < 300,
  });

  const apiError = response.data?.error;
  if (apiError !== undefined) {
    const detail = apiError.info ?? apiError.code ?? "unknown API error";
    throw new ScrapeError(`Fandom wiki API error: ${detail}`);
  }

  const html = response.data?.parse?.text?.["*"] ?? "";
  if (html.length === 0) {
    throw new ScrapeError(
      "Fandom wiki API returned empty page content — the page title may have changed.",
    );
  }

  return html;
}

export async function scrapeGenshinCodes(): Promise<ScrapedCodeRow[]> {
  try {
    const html = await fetchWikiHtml();
    const rows = parseCodeRows(html);

    if (rows.length === 0) {
      throw new ScrapeError(
        "Genshin scrape returned no codes — the wiki page structure may have changed.",
      );
    }

    return rows;
  } catch (error) {
    if (error instanceof ScrapeError) {
      throw error;
    }

    const cause =
      error instanceof Error ? error : new Error(String(error));
    throw new ScrapeError(
      "Failed to fetch Genshin promotional codes from Fandom wiki.",
      cause,
    );
  }
}

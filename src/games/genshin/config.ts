import { GenshinServer, type GenshinServerValue } from "../../config/constants.js";

export const genshinConfig = {
  redeemPageUrl: "https://genshin.hoyoverse.com/en/gift",
  wikiApiUrl: "https://genshin-impact.fandom.com/api.php",
  wikiPageTitle: "Promotional_Code",
  source: "genshin-impact.fandom.com",
  maxLoginAttempts: 3,
  logOutLabel: "Log Out",
  redeemCooldownMs: 5_000,
  maxRedeemRetries: 12,
  modalPollIntervalMs: 250,
  modalCloseTimeoutMs: 5_000,
  selectors: {
    codeTableRows: ".mw-parser-output > table > tbody > tr",
    codeLink: "td a.external.text",
    codeText: "code",
    activeRowStyle: "background-color:rgb(153,255,153,0.5)",
    redeemInput: "input[type='text']#cdkey__code",
    redeemSubmit: "button[type='submit'].cdkey-form__submit",
    redeemModal: '[data-modal="cdkeyResult"]',
    redeemModalMessage: ".cdkey-result__message",
    redeemModalClose: ".cdkey-result__close",
    userButton: ".cdkey__user-btn",
    serverButton: ".cdkey-select__btn",
    serverMenu: "#cdkey__region > div.cdkey-select__menu",
    loginIframe: "#hyv-account-frame",
    emailInput: 'input.el-input__inner[type="text"]',
    passwordInput: 'input.el-input__inner[type="password"]',
    loginSubmit: 'button[type="submit"]',
  },
} as const;

export function getServerMenuSelector(nthChild: number): string {
  return `${genshinConfig.selectors.serverMenu} > div:nth-child(${nthChild})`;
}

export const genshinServerNthChild: Record<GenshinServerValue, number> = {
  [GenshinServer.AMERICA]: 1,
  [GenshinServer.EUROPE]: 2,
  [GenshinServer.ASIA]: 3,
  [GenshinServer.TW_HK_MO]: 4,
};

import * as Bible from "../common/BooksOfTheBible";

/**
 * This function migrates the current pane settings from being an array of
 * string bibleIds to an object that includes both languageIds and bibleIds.
 * @example
 * {
 *  languageId: "en",
 *  bibleId: "ulb"
 * }
 * @param {Array} currentPaneSettings - array of current pane settings.
 */
export function migrateToLanguageAwareCurrentPaneSettings(currentPaneSettings) {
  const newCurrentPaneSettings = currentPaneSettings.map((bibleId) => {
    let languageId;
    switch (bibleId) {
      case Bible.NT_ORIG_LANG_BIBLE:
      case 'ugnt':
      case Bible.OT_ORIG_LANG_BIBLE:
      case 'uhb':
        languageId = 'originalLanguage';
        break;
      case 'ulb':
      case 'ult':
      case 'udb':
      case 'udt':
      case 'ust':
        languageId = 'en';
        break;
      case 'targetLanguage':
        languageId = 'targetLanguage';
        bibleId = 'targetBible';
        break;
      default:
      console.error(`${bibleId} is not found in the switch statement in migrateToLanguageAwareCurrentPaneSettings`);
        break;
    }
    const paneSetting = new Object();
    paneSetting.languageId = languageId;
    paneSetting.bibleId = bibleId;

    return paneSetting;
  });
  return newCurrentPaneSettings;
}

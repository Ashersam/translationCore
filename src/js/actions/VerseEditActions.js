import types from './ActionTypes';
// helpers
import {generateTimestamp} from '../helpers/index';
import * as gatewayLanguageHelpers from '../helpers/gatewayLanguageHelpers';
import {
  getSelectedToolApi,
  getSelectedToolName,
  getSupportingToolApis,
  getUsername
} from '../selectors';
import {getGroupDataForVerse, validateSelections} from "./SelectionsActions";
import path from "path-extra";
import fs from "fs-extra";

/**
 * Records an edit to the currently selected verse in the target bible.
 *
 * @deprecated use {@link editTargetVerse} instead.
 *
 * @param {string} before - Previous text version of the verse.
 * @param {string} after - New edited text version of the verse.
 * @param {string[]} tags - Array of tags used for verse Edit check boxes.
 * @param {string} [username=null] - The user's alias. If null the current username will be used.
 * @return {*}
 */
export const editSelectedTargetVerse = (before, after, tags, username=null) => {
  return (dispatch, getState) => {
    const contextId = getState().contextIdReducer.contextId;
    let {chapter, verse} = contextId.reference;
    dispatch(editTargetVerse(chapter, verse, before, after, tags, username));
  };
};

export const saveTwVerseEdit = (bookId, userAlias, before, after, tags, contextIdWithVerseEdit,
  currentCheckChapter, currentCheckVerse, gatewayLanguageCode, gatewayLanguageQuote,
  chapterWithVerseEdit, verseWithVerseEdit) => {

  gatewayLanguageQuote = gatewayLanguageQuote || "";
  return (dispatch, getState) => {
    const {projectSaveLocation} = getState().projectDetailsReducer;
    const modifiedTimestamp = generateTimestamp();
    const verseEdit = {
      verseBefore: before,
      verseAfter: after,
      tags,
      userName: userAlias,
      activeBook: bookId,
      activeChapter: currentCheckChapter,
      activeVerse: currentCheckVerse,
      modifiedTimestamp: modifiedTimestamp,
      gatewayLanguageCode,
      gatewayLanguageQuote,
      contextId: contextIdWithVerseEdit
    };
    const newFilename = modifiedTimestamp + '.json';
    const verseEditsPath = path.join(projectSaveLocation, '.apps', 'translationCore', 'checkData', 'verseEdits',
      bookId, chapterWithVerseEdit.toString(), verseWithVerseEdit.toString());
    fs.ensureDirSync(verseEditsPath);
    fs.outputJSONSync(path.join(verseEditsPath, newFilename.replace(/[:"]/g, '_')), verseEdit);
  };
};

/**
 * Updates a verse in the target bible.
 * This thunk will record the edit to the disk and update the target bible resource.
 *
 * @param {int} chapterWithVerseEdit
 * @param {int|string} verseWithVerseEdit
 * @param {string} before - the verse text before the edit
 * @param {string} after - the verse text after the edit
 * @param {string[]} tags - an array of tags indicating the reason for the edit
 * @param {string} [username=null] - The user's alias. If null the current username will be used.
 */
export const editTargetVerse = (chapterWithVerseEdit, verseWithVerseEdit, before, after, tags, username=null) => {
  return async (dispatch, getState) => {
    const {
      contextIdReducer
    } = getState();
    const {contextId: currentCheckContextId} = contextIdReducer;
    const { gatewayLanguageCode, gatewayLanguageQuote } = gatewayLanguageHelpers.getGatewayLanguageCodeAndQuote(getState());
    let {bookId, chapter: currentCheckChapter, verse: currentCheckVerse} = currentCheckContextId.reference;
    verseWithVerseEdit = (typeof verseWithVerseEdit === 'string') ? parseInt(verseWithVerseEdit) : verseWithVerseEdit; // make sure number
    const contextIdWithVerseEdit = {
      ...currentCheckContextId,
      reference: {
        ...currentCheckContextId.reference,
        chapter: chapterWithVerseEdit,
        verse: verseWithVerseEdit
      }
    };
    // fallback to the current username
    let userAlias = username;
    if(userAlias === null) {
      userAlias = getUsername(getState());
    }
    dispatch(validateSelections(after, contextIdWithVerseEdit, chapterWithVerseEdit, verseWithVerseEdit));
    dispatch(recordTargetVerseEdit(bookId, chapterWithVerseEdit, verseWithVerseEdit, before, after, tags, userAlias, generateTimestamp(), gatewayLanguageCode, gatewayLanguageQuote, currentCheckContextId));
    dispatch(updateTargetVerse(chapterWithVerseEdit, verseWithVerseEdit, after));
    if (getSelectedToolName(getState()) === 'translationWords') {
      // set verse edit flag for every check in verse edited
      const matchedGroupData = getGroupDataForVerse(getState(), contextIdWithVerseEdit);
      for (let groupItemKey of Object.keys(matchedGroupData)) {
        const groupItem = matchedGroupData[groupItemKey];
        if (groupItem) {
          for (let check of groupItem) {
            dispatch({
              type: types.TOGGLE_VERSE_EDITS_IN_GROUPDATA,
              contextId: check.contextId
            });
          }
        }
      }
    } else {
      dispatch({
        type: types.TOGGLE_VERSE_EDITS_IN_GROUPDATA,
        contextId: contextIdWithVerseEdit
      });
      dispatch(saveTwVerseEdit(bookId, userAlias, before, after, tags, contextIdWithVerseEdit,
        currentCheckChapter, currentCheckVerse, gatewayLanguageCode, gatewayLanguageQuote,
        chapterWithVerseEdit, verseWithVerseEdit));
    }

    // TRICKY: this is a temporary hack to validate verse edits.
    // TODO: This can be removed once the ScripturePane is updated to provide
    // callbacks for editing so that tools can manually perform the edit and
    // trigger validation on the specific verse.
    const newState = getState();
    const apis = getSupportingToolApis(newState);
    if('wordAlignment' in apis && apis['wordAlignment'] !== null) {
      // for other tools
      apis['wordAlignment'].trigger('validateVerse', chapterWithVerseEdit, verseWithVerseEdit);
    } else {
      // for wA
      const api = getSelectedToolApi(newState);
      if(api !== null && (currentCheckChapter !== chapterWithVerseEdit || currentCheckVerse !== verseWithVerseEdit)) {
        api.trigger('validateVerse', chapterWithVerseEdit, verseWithVerseEdit);
      }
    }
  };
};

/**
 * Records an edit to a verse in the target language bible.
 * This will result in the verse text being written to the disk.
 * This is closely related to {@link updateTargetVerse}.
 *
 * @param {string} book - the id of the book receiving the edit
 * @param {int} chapter - the chapter receiving the edit
 * @param {int} verse - the verse that was edited
 * @param {string} before - the verse text before the edit
 * @param {string} after - the verse text after the edit
 * @param {string[]} tags - an array of tags indicating the reason for the edit
 * @param {string} username - the current user's username
 * @param {string} modified - the edit timestamp
 * @param {string|null} [glCode=null] - the gateway language code
 * @param {string|null} [glQuote=null] - the gateway language code
 * @return {*}
 */
export const recordTargetVerseEdit = (bookId, chapter, verse, before, after, tags, username, modified, glCode=null, glQuote=null,
  {reference:{chapter:activeChapter, verse:activeVerse}, quote, groupId, occurrence}) => ({
  type: types.ADD_VERSE_EDIT,
  before,
  after,
  tags,
  username,
  activeBook: bookId,
  activeChapter,
  activeVerse,
  modifiedTimestamp: modified,
  gatewayLanguageCode: glCode,
  gatewayLanguageQuote: glQuote,
  reference: {
    bookId,
    chapter: parseInt(chapter),
    verse: parseInt(verse),
    groupId
  },
  quote,
  occurrence
});

/**
 * Updates the verse text in the target language bible resource.
 * This will not write any changes to the disk.
 * @param {int} chapter
 * @param {int} verse
 * @param {string} text
 * @return {*}
 */
export const updateTargetVerse = (chapter, verse, text) => ({
  type: types.UPDATE_TARGET_VERSE,
  editedText: text,
  chapter,
  verse
});

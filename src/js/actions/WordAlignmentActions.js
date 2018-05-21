/* eslint-disable no-console */

import * as AlertModalActions from './AlertModalActions';
import * as WordAlignmentHelpers from '../helpers/WordAlignmentHelpers';
import * as manifestHelpers from '../helpers/manifestHelpers';

/**
 * Wrapper for exporting project alignment data to usfm.
 * @param {string} projectSaveLocation - Full path to the users project to be exported
 * @param {boolean} output - Flag to set whether export will write to fs
 * @param {boolean} resetAlignments - Flag to set whether export will reset alignments
 * automatically or ask user
 */
export const getUsfm3ExportFile = (projectSaveLocation, output = false, resetAlignments = false) => {
  return dispatch => {
    return new Promise(async (resolve, reject) => {
      //Get path for alignment conversion
      const { wordAlignmentDataPath, projectTargetLanguagePath, chapters } = WordAlignmentHelpers.getAlignmentPathsFromProject(projectSaveLocation);
      const manifest = manifestHelpers.getProjectManifest(projectSaveLocation);
      /** Convert alignments from the filesystem under then project alignments folder */
      const usfm = await WordAlignmentHelpers.convertAlignmentDataToUSFM(
        wordAlignmentDataPath, projectTargetLanguagePath, chapters, projectSaveLocation, manifest.project.id
      ).catch(async (e) => {
        if (e && e.error && e.error.type === 'InvalidatedAlignments') {
          //error in converting alignment need to prompt user to fix
          const { chapter, verse } = e;
          const res = resetAlignments ? 'Export' : await dispatch(displayAlignmentErrorsPrompt(projectSaveLocation, chapter, verse));
          if (res === 'Export') {
            //The user chose to continue and reset the alignments
            await WordAlignmentHelpers.resetAlignmentsForVerse(projectSaveLocation, chapter, verse);
            await dispatch(getUsfm3ExportFile(projectSaveLocation, output, true));
            resolve();
          } else {
            reject();
          }
        }
      });
      //Write converted usfm to specified location
      if (output) WordAlignmentHelpers.writeToFS(output, usfm);
      resolve(usfm);
    });
  };
};

export function displayAlignmentErrorsPrompt() {
  return ((dispatch) => {
    return new Promise((resolve) => {
      const alignmentErrorsPrompt = 'Some alignments have been invalidated! To fix the invalidated alignment,\
open the project in the Word Alignment Tool. If you proceed with the export, the alignment for these verses will be reset.';
      dispatch(AlertModalActions.openOptionDialog(alignmentErrorsPrompt, (res) => {
        dispatch(AlertModalActions.closeAlertDialog());
        resolve(res);
      }, 'Export', 'Cancel'));
    });
  });
}

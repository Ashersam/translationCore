import React from 'react';
import path from 'path';
import fs from 'fs-extra';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// actions
import { showPopover } from '../actions/PopoverActions';
import { addComment } from '../actions/CommentsActions';
import { editTargetVerse } from '../actions/VerseEditActions';
import { toggleReminder } from '../actions/RemindersActions';
import {
  changeSelections,
  validateSelections
} from '../actions/SelectionsActions';
import {
  changeCurrentContextId,
  changeToNextContextId,
  changeToPreviousContextId,
  loadCurrentContextId
} from '../actions/ContextIdActions';
import { addGroupData } from '../actions/GroupsDataActions';
import { setGroupsIndex } from '../actions/GroupsIndexActions';
import { setToolSettings } from '../actions/SettingsActions';
import {
  closeAlertDialog,
  openAlertDialog,
  openOptionDialog
} from '../actions/AlertModalActions';
import { selectModalTab } from '../actions/ModalActions';
import * as ResourcesActions from '../actions/ResourcesActions';
import * as WordAlignmentActions from '../actions/WordAlignmentActions';
//helpers
import * as ResourcesHelpers from '../helpers/ResourcesHelpers';
import * as VerseObjectHelpers from '../helpers/VerseObjectHelpers';
import * as LexiconHelpers from '../helpers/LexiconHelpers';
import { getProjectSaveLocation } from '../selectors';

class ToolsContainer extends React.Component {

  constructor (props) {
    super(props);
    this.onWriteToolData = this.onWriteToolData.bind(this);
    this.onReadToolData = this.onReadToolData.bind(this);
  }

  componentDidMount () {
    let {contextId} = this.props.contextIdReducer;
    if (!contextId) this.props.actions.loadCurrentContextId();
  }

  componentWillReceiveProps (nextProps) {
    let {contextId} = nextProps.contextIdReducer;
    let {currentToolName} = nextProps.toolsReducer;
    // if contextId does not match current tool, then remove contextId
    if (contextId && contextId.tool !== currentToolName) {
      nextProps.actions.changeCurrentContextId(undefined);
    }
  }

  /**
   * Returns a handler for writing tool data.
   *
   * @param {string} toolId - the id of the tool that is writing data
   * @return {Function} - a write handler that returns a promise while writing
   */
  onWriteToolData (toolId) {
    return (filePath, data) => {
      const {projectSaveLocation} = this.props;
      const writePath = path.join(projectSaveLocation,
        '.apps/translationCore/tools/', toolId, filePath);
      return fs.outputFile(writePath, data);
    };
  }

  /**
   * Returns a handler for reading tool data.
   * @param {string} toolId - the id of the tool that is writing data
   * @return {Function} - a read handler that returns a promise while reading
   */
  onReadToolData (toolId) {
    return async (filePath) => {
      const {projectSaveLocation} = this.props;
      const readPath = path.join(projectSaveLocation,
        '.apps/translationCore/tools/', toolId, filePath);
      const exists = await fs.pathExists(readPath);
      if(exists) {
        return await fs.readFile(readPath);
      } else {
        return false;
      }
    };
  }

  render () {
    const {currentLanguage} = this.props;
    let {currentToolViews, currentToolName} = this.props.toolsReducer;
    let Tool = currentToolViews[currentToolName];

    const {code} = currentLanguage;

    return (
      <Tool {...this.props}
            writeToolData={this.onWriteToolData(currentToolName)}
            onReadToolData={this.onReadToolData(currentToolName)}
            appLanguage={code}
            currentToolViews={currentToolViews}/>
    );
  }
}

ToolsContainer.propTypes = {
  projectSaveLocation: PropTypes.string.isRequired,
  toolsReducer: PropTypes.any.isRequired,
  actions: PropTypes.any.isRequired,
  contextIdReducer: PropTypes.any.isRequired,
  currentLanguage: PropTypes.object.isRequired
};

const mapStateToProps = state => {
  return {
    projectSaveLocation: getProjectSaveLocation(state),
    toolsReducer: state.toolsReducer,
    loginReducer: state.loginReducer,
    settingsReducer: state.settingsReducer,
    loaderReducer: state.loaderReducer,
    resourcesReducer: state.resourcesReducer,
    commentsReducer: state.commentsReducer,
    remindersReducer: state.remindersReducer,
    invalidatedReducer: state.invalidatedReducer,
    contextIdReducer: state.contextIdReducer,
    projectDetailsReducer: state.projectDetailsReducer,
    selectionsReducer: state.selectionsReducer,
    verseEditReducer: state.verseEditReducer,
    groupsIndexReducer: state.groupsIndexReducer,
    groupsDataReducer: state.groupsDataReducer,
    wordAlignmentReducer: state.wordAlignmentReducer
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      goToNext: () => {
        dispatch(changeToNextContextId());
      },
      goToPrevious: () => {
        dispatch(changeToPreviousContextId());
      },
      showPopover: (title, bodyText, positionCoord) => {
        dispatch(showPopover(title, bodyText, positionCoord));
      },
      addNewBible: (bibleName, bibleData) => {
        dispatch(ResourcesActions.addNewBible(bibleName, bibleData));
      },
      loadResourceArticle: (resourceType, articleId, languageId) => {
        dispatch(ResourcesActions.loadResourceArticle(resourceType, articleId,
          languageId));
      },
      loadLexiconEntry: (lexiconId, entryId) => {
        dispatch(ResourcesActions.loadLexiconEntry(lexiconId, entryId));
      },
      addComment: (text, userName) => {
        dispatch(addComment(text, userName));
      },
      changeSelections: (selections, userName) => {
        dispatch(changeSelections(selections, userName));
      },
      validateSelections: (targetVerse) => {
        dispatch(validateSelections(targetVerse));
      },
      toggleReminder: (userName) => {
        dispatch(toggleReminder(userName));
      },
      selectModalTab: (tab, section, vis) => {
        dispatch(selectModalTab(tab, section, vis));
      },
      editTargetVerse: (chapter, verse, before, after, tags, username) => {
        dispatch(
          editTargetVerse(chapter, verse, before, after, tags, username));
      },
      changeCurrentContextId: (contextId) => {
        dispatch(changeCurrentContextId(contextId));
      },
      loadCurrentContextId: () => {
        dispatch(loadCurrentContextId());
      },
      addGroupData: (groupId, groupData) => {
        dispatch(addGroupData(groupId, groupData));
      },
      setGroupsIndex: (groupsIndex) => {
        dispatch(setGroupsIndex(groupsIndex));
      },
      setToolSettings: (NAMESPACE, settingsPropertyName, toolSettingsData) => {
        dispatch(
          setToolSettings(NAMESPACE, settingsPropertyName, toolSettingsData));
      },
      openAlertDialog: (message) => {
        dispatch(openAlertDialog(message));
      },
      openOptionDialog: (alertMessage, callback, button1Text, button2Text) => {
        dispatch(
          openOptionDialog(alertMessage, callback, button1Text, button2Text));
      },
      closeAlertDialog: () => {
        dispatch(closeAlertDialog());
      },
      moveWordBankItemToAlignment: (DropBoxItemIndex, WordBankItem) => {
        dispatch(
          WordAlignmentActions.moveWordBankItemToAlignment(DropBoxItemIndex,
            WordBankItem));
      },
      moveTopWordItemToAlignment: (topWordItem, fromAlignmentIndex, toAlignmentIndex) => {
        dispatch(WordAlignmentActions.moveTopWordItemToAlignment(topWordItem,
          fromAlignmentIndex, toAlignmentIndex));
      },
      moveBackToWordBank: (wordBankItem) => {
        dispatch(WordAlignmentActions.moveBackToWordBank(wordBankItem));
      },
      getWordListForVerse: VerseObjectHelpers.getWordListForVerse,
      getGLQuote: ResourcesHelpers.getGLQuote,
      getLexiconData: LexiconHelpers.getLexiconData
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolsContainer);

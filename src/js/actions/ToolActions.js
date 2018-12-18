import types from "./ActionTypes";
import { loadToolsInDir } from "../helpers/toolHelper";
import { getToolGatewayLanguage, getTranslate, getToolCategories, getProjectBookId, getProjectSaveLocation } from "../selectors";
import * as ModalActions from "./ModalActions";
import * as AlertModalActions from "./AlertModalActions";
import path from "path-extra";
import ospath from "ospath";
import * as ResourcesHelpers from "../helpers/ResourcesHelpers";
import * as GroupsDataActions from "./GroupsDataActions";
import { loadCurrentContextId } from "./ContextIdActions";
import * as BodyUIActions from "./BodyUIActions";
// import { getGroupsIndex } from "./ProjectDataLoadingActions";
// import { getGroupsData } from "./ProjectDataLoadingActions";
import fs from "fs-extra";
import * as GroupsIndexActions from "./GroupsIndexActions";

/**
 * Registers a tool that has been loaded from the disk.
 * @param {object} tool - a tc-tool.
 */
export const registerTool = tool => ({
  type: types.ADD_TOOL,
  name: tool.name,
  tool
});

/**
 * Loads the app tools.
 * This puts the tools into redux for later use.
 * @param {string} toolsDir - path to the tools directory
 * @returns {Function}
 */
export const loadTools = (toolsDir) => (dispatch) => {
  // TRICKY: push this off the render thread just for a moment to simulate threading.
  setTimeout(() => {
    loadToolsInDir(toolsDir).then((tools) => {
      for(let i = 0, len = tools.length; i < len; i ++) {
        dispatch(registerTool(tools[i]));
      }
    });
  }, 500);
};

/**
 * Opens a tool
 * @param {string} name - the name of the tool to open
 * @returns {Function}
 */
export const openTool = (name) => (dispatch, getData) => {
  const translate = getTranslate(getData());

  dispatch(ModalActions.showModalContainer(false));
  dispatch({ type: types.START_LOADING });
  setTimeout(() => {
    try {
      dispatch(resetReducersData());
      dispatch({
        type: types.OPEN_TOOL,
        name
      });
      dispatch(initializeProjectGroups(name));
    } catch (e) {
      console.warn(e);
      AlertModalActions.openAlertDialog(translate('projects.error_setting_up_project', {email: translate('_.help_desk_email')}));
    }
  }, 100);
};

/**
 * Initializes the project's group indices.
 * @param {string} toolName
 * @returns {*}
 */
export function initializeProjectGroups(toolName) {
  return ((dispatch, getState) => {
    const state = getState();
    const translate = getTranslate(state);
    return new Promise((resolve, reject) => {
      const state = getState();
      let selectedCategories = getToolCategories(state, toolName);
      const bookAbbreviation = getProjectBookId(state);
      const projectSaveLocation = getProjectSaveLocation(state);
      const dataDirectory = path.join(projectSaveLocation, '.apps', 'translationCore', 'index', toolName);
      const categoryGroupsLoadActions = [];
      if (toolName === 'wordAlignment') {
        selectedCategories = ['default'];
      }

      // populate group indices
      const gatewayLanguage = getToolGatewayLanguage(state, toolName);
      const toolResourceDirectory = path.join(ospath.home(), 'translationCore', 'resources', gatewayLanguage, 'translationHelps', toolName);
      const versionDirectory = ResourcesHelpers.getLatestVersionInPath(toolResourceDirectory) || toolResourceDirectory;
      selectedCategories.forEach((category) => {
        // if resource in the below path doesn't exist, an empty groups index will be generated by getGroupsIndex().
        // wordAlignment is a tool that this happens with.
        const glDataDirectory = path.join(versionDirectory, category);
        categoryGroupsLoadActions.push(
          new Promise((resolve) => {
            getGroupsIndex(dispatch, glDataDirectory, translate)
            .then(
              () => getGroupsData(dispatch, dataDirectory, toolName, bookAbbreviation, category)
            ).then(resolve)
            .catch(reject);
          })
        );
      });
      Promise.all(categoryGroupsLoadActions).then(() => {
        dispatch(GroupsDataActions.verifyGroupDataMatchesWithFs());
        dispatch(loadCurrentContextId());
        dispatch({type: types.TOGGLE_LOADER_MODAL, show: false});
        dispatch(BodyUIActions.toggleHomeView(false));
        resolve();
      }).catch(reject);
    })
    .catch(err => {
      console.warn(err);
      AlertModalActions.openAlertDialog(translate('projects.error_loading', {email: translate('_.help_desk_email')}));
    });
  });
}

export function resetReducersData() {
  // TODO: this is crazy. All of related reducers could be keyed by the same action.
  return (dispatch => {
    dispatch({ type: types.CLEAR_PREVIOUS_GROUPS_DATA });
    dispatch({ type: types.CLEAR_PREVIOUS_GROUPS_INDEX });
    dispatch({ type: types.CLEAR_CONTEXT_ID });
    dispatch({ type: types.CLEAR_ALIGNMENT_DATA });
    dispatch({ type: types.CLEAR_RESOURCES_REDUCER });
    dispatch({ type: types.CLEAR_PREVIOUS_FILTERS});
  });
}


/**
* Loads the group index from the filesystem or generates a new one.
* @param {function} dispatch - redux action dispatcher.
* @param {string} dataDirectory - group index data path location in the filesystem.
* @param {function} translate
* @return {Promise<void>}
*/
export function getGroupsIndex(dispatch, dataDirectory, translate) {
  return new Promise((resolve) => {
    const groupIndexDataDirectory = path.join(dataDirectory, 'index.json');
    let groupIndexData;
    try {
      groupIndexData = fs.readJsonSync(groupIndexDataDirectory);
      dispatch(GroupsIndexActions.loadGroupsIndex(groupIndexData));
      resolve();
    } catch (err) {
      console.log('No GL based index found for tool, will use a generated chapterGroupsIndex.');
      groupIndexData = ResourcesHelpers.chapterGroupsIndex(translate);
      dispatch(GroupsIndexActions.loadGroupsIndex(groupIndexData));
      resolve();
    }
  });
}

/**
 * @description loads the group index from the filesystem.
 * @param {function} dispatch - redux action dispatcher.
 * @param {String} dataDirectory - group data path or save location in the filesystem.
 * @param {String} toolName - name if the tool being loaded.
 * @param {String} bookAbbreviation - book abbreviation stinrg.
 * @return {object} object action / Promises.
 */
export function getGroupsData(dispatch, dataDirectory, toolName, bookAbbreviation, category) {
  return new Promise((resolve) => {
    let groupsDataDirectory = path.join(dataDirectory, bookAbbreviation);
    const groupsDataLoadedIndex = path.join(groupsDataDirectory, '.categories');
    let groupsDataAlreadyLoaded = [];
    let categoriesIndexObject = {
      current: ['kt', 'other', 'names'],
      loaded: []
    };
    if (fs.existsSync(groupsDataLoadedIndex)) {
      try {
        categoriesIndexObject = fs.readJSONSync(groupsDataLoadedIndex);
        groupsDataAlreadyLoaded = categoriesIndexObject.loaded;
      } catch (e) {
        console.warn('Could not parse old check categories, making new one');
      }
    }
    if (groupsDataAlreadyLoaded.indexOf(category) >= 0) {
      // read in the groupsData files and load groupsData to reducer
      loadAllGroupsData(groupsDataDirectory, dispatch);
      resolve(true);
    } else {
      // The groups data files were not found in the directory thus copy
      // them from User resources folder to project resources folder.
      ResourcesHelpers.copyGroupsDataToProjectResources(toolName, groupsDataDirectory, bookAbbreviation, category);
      // read in the groupsData files and load groupsData to reducer
      //TODO: Read in the groups data object from above rather than from the FS
      loadAllGroupsData(groupsDataDirectory, dispatch);
      groupsDataAlreadyLoaded  = groupsDataAlreadyLoaded.push(category);
      fs.writeJSONSync(path.join(groupsDataDirectory, '.categories'), categoriesIndexObject);
      console.log('Generated and Loaded group data data from fs');
      resolve(true);
    }
  });
}

/**
 * Loads all the groups data files from filesystem.
 * @param {string} groupsDataDirectory - groups data save location in the filesystem.
 * @param {function} dispatch - redux dispatch function.
 * @return {object} object action / Promises.
 */
export function loadAllGroupsData(groupsDataDirectory, dispatch) {
  // read in the groupsData files
  let groupDataFolderObjs = fs.readdirSync(groupsDataDirectory);
  let allGroupsData = {};
  for (let groupId in groupDataFolderObjs) {
    if (path.extname(groupDataFolderObjs[groupId]) !== '.json' || groupDataFolderObjs[groupId][0] === '.') {
      continue;
    }
    let groupName = groupDataFolderObjs[groupId].split('.')[0];
    let groupData = loadGroupData(groupName, groupsDataDirectory);
    if (groupData) {
      allGroupsData[groupName] = groupData;
    }
  }
  // load groupsData to reducer
  dispatch({
    type: types.LOAD_GROUPS_DATA_FROM_FS,
    allGroupsData
  });
}

/**
 * @description helper function that loads a group data file
 * from the filesystem.
 * @param {string} groupName - group data name.
 * @param {string} groupDataFolderPath - group data save location in the filesystem.
 * @return {object} object action / Promises.
 */
export function loadGroupData(groupName, groupDataFolderPath) {
  const groupPath = path.join(groupDataFolderPath, groupName + '.json');
  let groupData;
  try {
    groupData = fs.readJsonSync(groupPath);
  } catch (err) {
    console.warn('failed loading group data for ' + groupName);
  }
  return groupData;
}

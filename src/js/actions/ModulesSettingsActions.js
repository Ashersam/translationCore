import consts from './ActionTypes';

/**
 * @description helper function that Updates/changes a tools'/modules' settings.
 * @param {string} moduleNamespace - module name that would be saved
 * as a property of the modulesSettingsReducer object.
 * @param {string} settingsPropertyName - is he property name to be used
 *  to save multiple settings names for a tool/module.
 * @param {object} moduleSettingsData - settings data.
 * @return {object} acton object.
 */
function updateModuleSettings(moduleNamespace, settingsPropertyName, moduleSettingsData) {
  return {
    type: consts.UPDATE_MODULE_SETTINGS,
    moduleNamespace,
    settingsPropertyName,
    moduleSettingsData
  };
}

export const setModuleSettings = (moduleNamespace, settingsPropertyName, moduleSettingsData) => {
  return updateModuleSettings(moduleNamespace, settingsPropertyName, moduleSettingsData);
};

export const changeModuleSettings = (moduleNamespace, settingsPropertyName, moduleSettingsData) => {
  return updateModuleSettings(moduleNamespace, settingsPropertyName, moduleSettingsData);
};

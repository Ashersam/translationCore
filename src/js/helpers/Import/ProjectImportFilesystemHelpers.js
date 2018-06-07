import fs from 'fs-extra';
import path from 'path-extra';
import ospath from 'ospath';
//helpers
import * as manifestHelpers from '../manifestHelpers';
// constants
const IMPORTS_PATH = path.join(ospath.home(), 'translationCore', 'imports');
const PROJECTS_PATH = path.join(ospath.home(), 'translationCore', 'projects');

/**
 * @description Import Helpers for moving projects to `~/translationCore/imports` while importing
 * and to `~/translationCore/projects` after migrations and validation.
 * @param {String} projectName
 */
export const move = (projectName, translate) => {
  return new Promise((resolve, reject) => {
    const fromPath = path.join(IMPORTS_PATH, projectName);
    const toPath = path.join(PROJECTS_PATH, projectName);
    const projectPath = path.join(PROJECTS_PATH, projectName);
    // if project does not exist then move import to projects
    const projectAlreadyExists = projectExistsInProjectsFolder(fromPath);
    if (projectAlreadyExists || fs.existsSync(toPath)) {
      fs.removeSync(path.join(IMPORTS_PATH, projectName));
      // two translatable strings are concatenated for response.
      const compoundMessage = translate('projects.project_exists', { project_path: projectName }) +
          " " + translate('projects.reimporting_not_supported');
      reject(compoundMessage);
    } else {
      // copy import to project
      if (fs.existsSync(fromPath)) {
        fs.copySync(fromPath, toPath);
        // verify target project copied
        if (fs.existsSync(toPath)) {
          // remove from imports
          fs.removeSync(fromPath);
          resolve(projectPath);
        } else {
          reject({ message: 'projects.import_error', data: { fromPath, toPath } });
        }
      } else {
        reject({ message: 'projects.not_found', data: { projectName, fromPath } });
      }
    }
  });
};

/**
 * Helper function to check if the given project exists in the 'projects folder', goes beyond name and checks
 *    attributes such as language_id, bookId, resource_id
 *
 * @param {string} fromPath - Path that the project is moving from
 * located in the imports folder
 * @returns {boolean} - True if the project provided already exists in the
 * projects folder
 */
export function projectExistsInProjectsFolder(fromPath) {
  const isDirectory = fs.lstatSync(fromPath).isDirectory();
  if (!isDirectory) return false;
  const importProjectManifest = manifestHelpers.getProjectManifest(fromPath);
  const { target_language: { id }, project, resource } = importProjectManifest;
  const resourceId = resource && resource.slug ? resource.slug : '';
  const projectsThatMatchImportType = getProjectsByType(id, project.id, resourceId );
  return projectsThatMatchImportType.length > 0;
}

/**
 * Helper function to get projects from the projects folder by a given type
 *
 * @param {string} tLId - Target language id. e.g. hi
 * @param {string} bookId - Project book id e.g. tit
 * @param {string} resourceId - Translation identifier e.g. ULT
 * @returns {array} - Array of paths that match specified type ['~/tC/projects/myproject1', '~/tC/projects/myproject2']
 */
export function getProjectsByType(tLId, bookId, resourceId) {
  const destinationPathProjects = fs.readdirSync(PROJECTS_PATH);
  return destinationPathProjects.filter((projectPath) => {
    const isDirectory = fs.lstatSync(path.join(PROJECTS_PATH, projectPath)).isDirectory();
    if (!isDirectory) return false;
    const importProjectManifest = manifestHelpers.getProjectManifest(path.join(PROJECTS_PATH, projectPath));
    const { target_language: { id }, project, resource } = importProjectManifest;
    const resourceId_ = resource && resource.slug ? resource.slug : '';
    return id === tLId && project.id === bookId && resourceId_ === resourceId;
  });
}

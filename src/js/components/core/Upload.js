/**
 * @author Ian Hoegen
 * @description: This is the modal for the drag and drop upload feature.
 ******************************************************************************/
const React = require('react');
const Path = require('path');
const fs = require(window.__base + 'node_modules/fs-extra');

const Button = require('react-bootstrap/lib/Button.js');
const Nav = require('react-bootstrap/lib/Nav.js');
const NavItem = require('react-bootstrap/lib/NavItem.js');

const OnlineInput = require('./OnlineInput');
const DragDrop = require('./DragDrop');
const CoreStore = require('../../stores/CoreStore');
const ManifestGenerator = require('./create_project/ProjectManifest.js');
const CheckStore = require('../../stores/CheckStore');
const ImportUsfm = require('./Usfm/ImportUSFM');
const Recent = require('./RecentProjects.js');
const api = window.ModuleApi;
const books = require('./BooksOfBible.js');

const IMPORT_PROJECT = 'Import Translation Studio Project';
const IMPORT_LOCAL = 'Import Project Locally';
const IMPORT_ONLINE = 'Import From Online';
const IMPORT_USFM = 'Import From USFM File';


const UploadModal = React.createClass({
  getInitialState: function () {
    return { active: 1, show: 'link', link: "" };
  },

  /**
   * @description - This toggles our view to change from importing from online to importing
   * from disk
   * @param {integer} eventKey - The 'key' that the tabs send their 'onSelect' event listener
   */
  handleSelect: function (eventKey) {
    this.setState({ active: eventKey });
    if (eventKey === 1) {
      this.setState({ show: 'link' });
    } else if (eventKey === 2) {
      this.setState({ show: 'file' });
    } else if (eventKey === 3) {
      this.setState({ show: 'usfm' });
    }
  },

  getLink() {
    return this.refs.Online.state.value;
  },

    /**
   * @description - Sets the target language filepath and/or link, while also generatering a TC
   * manifest file and saving the params and saveLocation under the 'common' namespace in the
   * CheckStore
   * @param {string} path - The folder path that points to the directory that the translationStudio
   * project lives, which should include a manifest file
   * @param {string} link - URL that points to the location of a translationStudio project located on
   * the GOGS server
   */
  sendFilePath: function (path, link, callback) {
    var _this = this;
    this.clearPreviousData();
    if (path) {
      _this.translationCoreManifestPresent(path, (err, tcManifest) => {
        if (tcManifest) {
          _this.loadProjectThatHasManifest(path, callback, tcManifest);
        } else if (!tcManifest) {
          _this.loadTranslationStudioManifest(path,
            (err, translationStudioManifest) => {
              if (!err) {
                _this.saveManifest(path, link, translationStudioManifest, (err, tcManifest) => {
                  _this.loadProjectThatHasManifest(path, callback, tcManifest);
                });
              }
              else if (err) {
                _this.manifestError(err);
              }
            });
        } else if (err) {
          _this.manifestError(err);
        }
      });
    }
  },

  /**
   * @description - Generates and saves a translationCore manifest file
   * @param {string} saveLocation - Filepath of where the translationCore manifest file will
   * be saved. This is an ABSOLUTE PATH
   * @param {object} data - The translationCore manifest data to be saved
   * @param {object} tsManifest - The translationStudio manifest data loaded from a translation
   * studio project
   */
  saveManifest: function (saveLocation, link, tsManifest, callback) {
    var data = {
      user: [CoreStore.getLoggedInUser()],
      repo: link || undefined
    }
    var manifest;
    try {
      var manifestLocation = Path.join(saveLocation, 'tc-manifest.json');
      if (tsManifest.package_version == '3') {
        manifest = this.fixManifestVerThree(tsManifest);
      } else {
        manifest = ManifestGenerator(data, tsManifest);
      }
      fs.outputJson(manifestLocation, manifest, function (err) {
        if (err) {
          this.manifestError('Error Saving tC Manifest');
        }
        callback(null, manifest);
      });
    }
    catch (err) {
      callback(err, null);
    }
  },

  fixManifestVerThree: function (oldManifest) {
    var newManifest = {};
    for (var oldElements in oldManifest) {
      newManifest[oldElements] = oldManifest[oldElements];
    }
    newManifest.finished_chunks = oldManifest.finished_frames;
    newManifest.ts_project = {};
    newManifest.ts_project.id = oldManifest.project_id;
    newManifest.ts_project.name = api.convertToFullBookName(oldManifest.project_id);
    for (var el in oldManifest.source_translations) {
      newManifest.source_translations = oldManifest.source_translations[el];
      var parameters = el.split("-");
      newManifest.source_translations.language_id = parameters[1];
      newManifest.source_translations.resource_id = parameters[2];
      break;
    }
    return newManifest;

  },

  /**
   * @desription - This generates the default params from the path and saves it in the CheckStore
   * @param {string} path - The path to the folder containing the translationStudio project
   * @param {object} translationStudioManifest - The parsed json object of the translationStudio
   * manifest
   */
  getParams: function (path, callback) {
    var tcManifest = api.getDataFromCommon('tcManifest');
    isArray = function (a) {
      return (!!a) && (a.constructor === Array);
    };
    if (tcManifest.package_version == '3') {
      tcManifest = this.fixManifestVerThree(tcManifest);
    }
    var ogPath = Path.join(window.__base, 'static', 'tagged');
    var params = {
      'originalLanguagePath': ogPath
    }
    params.targetLanguagePath = path;
    try {
      if (tcManifest.ts_project) {
        params.bookAbbr = tcManifest.ts_project.id;
      }
      else if (tcManifest.project) {
        params.bookAbbr = tcManifest.project.id;
      }
      else {
        params.bookAbbr = tcManifest.project_id;
      }

      //not actually used right now because we're hard coded for english
      if (isArray(tcManifest.source_translations)) {
        params.gatewayLanguage = tcManifest.source_translations[0].language_id;
      } else {
        params.gatewayLanguage = tcManifest.source_translations.language_id;
      }
      params.direction = tcManifest.target_language.direction || tcManifest.target_language.direction;
      if (this.isOldTestament(params.bookAbbr)) {
        params.originalLanguage = "hebrew";
      } else {
        params.originalLanguage = "greek";
      }
    } catch (e) {
      this.manifestError(e);
    }
    return params;
  },

  isOldTestament: function (projectBook) {
    var passedBook = false;
    for (var book in books) {
      if (book == projectBook) passedBook = true;
      if (books[book] == "Malachi" && passedBook) {
        return true;
      }
    }
    return false;
  },

  clearPreviousData: function () {
    CheckStore.WIPE_ALL_DATA();
    api.modules = {};
  },


  manifestError: function (content) {
    const alert = {
      title: 'Error Setting Up Project',
      content: content,
      leftButtonText: 'Ok'
    }
    api.createAlert(alert);
  },


  loadProjectThatHasManifest: function (path, callback, tcManifest) {
    var Access = require('./AccessProject');
    api.putDataInCommon('tcManifest', tcManifest);
    Recent.add(path);
    api.putDataInCommon('saveLocation', path);
    api.putDataInCommon('params', this.getParams(path));
    try {
      Access.loadFromFilePath(path, callback);
    } catch (err) {
      //this executes if something fails, not sure how efficient this is
      this.manifestError(err);
      ImportUsfm.loadProject(path);
    }
  },


  /**
   * @description - Loads in a translationStudio manifest
   */
  loadTranslationStudioManifest: function (path, callback) {
    var manifestLocation = Path.join(path, 'manifest.json');
    fs.readJson(manifestLocation, callback);
  },

  /**
   * @description - This checks to see if a valid translationCore manifest file is present.
   * @param {string} path - absolute path to a translationStudio project folder
   */
  translationCoreManifestPresent: function (path, callback) {
    try {
      var hasManifest = fs.readJsonSync(Path.join(path, 'tc-manifest.json'));
      if (hasManifest) {
        callback(null, hasManifest);
      }
    }
    catch (e) {
      callback(e, null);
    }
  },

  /**
   * @description - Renders the upload modal
   */
  render: function () {
    var mainContent;
    if (this.state.show === 'file') {
      mainContent = <DragDrop
        styles={this.props.styles}
        sendFilePath={this.sendFilePath}
        properties={['openDirectory']}
        isWelcome={this.props.isWelcome}
        />;
    }
    else if (this.state.show === 'link') {
      mainContent = (
        <div>
          <br />
          <OnlineInput ref={"Online"} pressedEnter={this.props.pressedEnter} sendFilePath={this.sendFilePath} />
        </div>
      );
    } else if (this.state.show === 'usfm') {
      mainContent = (
        <div>
          <ImportUsfm.component isWelcome={this.props.isWelcome} />
        </div>
      )
    }
    if (this.props.show !== false) {
      return (
        <div>
          <Nav bsStyle="tabs" activeKey={this.state.active} onSelect={this.handleSelect}>
            <NavItem eventKey={1}>{IMPORT_ONLINE}</NavItem>
            <NavItem eventKey={2}>{IMPORT_LOCAL}</NavItem>
            <NavItem eventKey={3}>{IMPORT_USFM}</NavItem>
          </Nav>
          {mainContent}
        </div>
      );
    } else {
      return (<div> </div>)
    }
  }
});

module.exports = UploadModal;

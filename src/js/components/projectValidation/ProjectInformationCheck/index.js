import React, { Component } from 'react';
import PropTypes from 'prop-types';
// components
import { Card } from 'material-ui/Card';
import BookDropdownMenu from './BookDropdownMenu';
import TextPrompt from './TextPrompt';
import LanguageIdTextBox from './LanguageIdTextBox';
import LanguageNameTextBox from './LanguageNameTextBox';
import LanguageDirectionDropdownMenu from './LanguageDirectionDropdownMenu';
import ContributorsArea from './ContributorsArea';
import CheckersArea from './CheckersArea';
import ProjectValidationContentWrapper from '../ProjectValidationContentWrapper';
import ReactDOMServer from "react-dom/server";
import {getIsOverwritePermitted} from "../../../selectors";

class ProjectInformationCheck extends Component {
  constructor() {
    super();
    this.state = {
      contributorsRequiredFieldMessage: false,
      checkersRequiredFieldMessage: false,
      showOverwriteButton: false
    };
  }

  addContributor() {
    let { contributors } = this.props.reducers.projectInformationCheckReducer;
    // if an empty text field has been created then dont add a new one until it is filled.
    if (contributors.includes('')) {
      this.setState({ contributorsRequiredFieldMessage: true });
    } else {
      contributors.unshift('');
      this.props.actions.setContributorsInProjectInformationReducer(contributors);
    }
  }

  addChecker() {
    let { checkers } = this.props.reducers.projectInformationCheckReducer;
    // if an empty text field has been created then dont add a new one until it is filled.
    if (checkers.includes('')) {
      this.setState({ checkersRequiredFieldMessage: true });
    } else {
      checkers.unshift('');
      this.props.actions.setCheckersInProjectInformationReducer(checkers);
    }
  }

  removeContributor(selectedIndex) {
    const { contributors } = this.props.reducers.projectInformationCheckReducer;
    const newContributorsArray = contributors.filter((element, index) => {
      return index !== selectedIndex;
    });
    this.setState({ contributorsRequiredFieldMessage: false });
    this.props.actions.setContributorsInProjectInformationReducer(newContributorsArray);
  }

  removeChecker(selectedIndex) {
    const { checkers } = this.props.reducers.projectInformationCheckReducer;
    const newCheckersArray = checkers.filter((element, index) => {
      return index !== selectedIndex;
    });
    this.setState({ checkersRequiredFieldMessage: false });
    this.props.actions.setCheckersInProjectInformationReducer(newCheckersArray);
  }

  displayOverwriteButton(enable) {
    if (this.state.showOverwriteButton !== enable) {
      this.setState({showOverwriteButton: enable});
      this.props.actions.displayOverwriteButton(enable);
    }
  }

  shouldComponentUpdate(nextProps) {
    let changed = this.changed(nextProps,'bookId');
    changed = changed || this.changed(nextProps,'languageId');
    changed = changed || this.changed(nextProps,'languageName');
    changed = changed || this.changed(nextProps,'languageDirection');
    changed = changed || this.changed(nextProps,'contributors');
    changed = changed || this.changed(nextProps,'checkers');
    changed = changed || this.changed(nextProps,'resourceId');
    changed = changed || this.changed(nextProps,'nickname');
    return changed;
  }

  changed(nextProps, property) {
    let oldProp = this.props.reducers.projectInformationCheckReducer[property];
    let newProp = nextProps.reducers.projectInformationCheckReducer[property];
    if (property === 'checkers' || property === 'contributors') oldProp = false; newProp = true;
    return oldProp !== newProp;
  }

  /**
   * limit string length
   * @param {String} text
   * @param {Int} len
   */
  limitStringLength(text, len) {
    if (text && (text.length > len)) {
      return text.substr(0, len);
    }
    return text;
  }

  render() {
    const {
      bookId,
      resourceId,
      nickname,
      languageId,
      languageName,
      languageDirection,
      contributors,
      checkers
    } = this.props.reducers.projectInformationCheckReducer;
    const { projectSaveLocation } = this.props.reducers.projectDetailsReducer;
    const { developerMode } = this.props.reducers.settingsReducer.currentSettings;
    const {translate} = this.props;
    const overWritePermitted = getIsOverwritePermitted(this.props.reducers);
    const instructions = (
      <div>
        <p>
          {translate('project_validation.project_information_missing')}
        </p><br /><br />
        <h4>{translate('project_validation.attention')}</h4>
        <p>
          {translate('project_validation.publicly_available')}
        </p>
      </div>
    );
    const maxResourceIdLength = 4;

    /**
     * checks resourceId for warnings, if there is a warning it will be translated
     * @param text
     * @return {*}
     */
    function getResourceIdWarning(text) {
      const duplicateWarning = this.props.actions.getDuplicateProjectWarning(text, languageId, bookId, projectSaveLocation);
      this.props.actions.displayOverwriteButton(overWritePermitted && !!duplicateWarning);
      let warning = this.props.actions.getResourceIdWarning(text);
      if (!warning) { // if valid resource, check for conflicting projects
        warning = duplicateWarning;
      }
      if (warning) {
        warning = translate(warning);
      }
      return warning;
    }

    /**
     * gets the info hint.  The complication is that if there is html in the string, translate() will return as
     *  a react element (object) that is not displayable as hint, so we need to convert to simple html and remove
     *  the <span></span> wrapper
     * @return {*}
     */
    function getResourceInfoHint() {
      const infoText = translate('project_validation.resource_id.info');
      if (typeof infoText !== 'string') { // if translate wrapped as react element
        let html = ReactDOMServer.renderToStaticMarkup(infoText);
        if (html) {
          // remove span wrapper if present
          let parts = html.split('<span>');
          html = parts[0] || parts[1];
          parts = html.split('</span>');
          html = parts[0];
          return html;
        }
      }
      return infoText;
    }

    return (
      <ProjectValidationContentWrapper translate={translate}
                                       instructions={instructions}>
          {translate('project_information')}
          <Card
            id="project-information-card"
            style={{ width: '100%', height: '100%' }}
            containerStyle={{ overflowY: 'auto', overflowX: 'hidden', height: '100%' }}
          >
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#cd0033', margin: '10px 10px 0px' }}>* {translate('required')}</span>
            </div>
            <div style={{maxWidth: '600px', margin: '0 auto', display: "flex", flexWrap: "wrap", flexBasic: "50%"}}>
              <div style={{flex: '1 1', margin: '10px', minWidth:'260px'}}>
                <LanguageNameTextBox
                  translate={translate}
                  languageName={languageName}
                  languageId={languageId}
                  updateLanguageName={(languageName) => this.props.actions.setLanguageNameInProjectInformationReducer(languageName)}
                  updateLanguageId={(languageId) => this.props.actions.setLanguageIdInProjectInformationReducer(languageId)}
                  updateLanguageSettings={(languageId, languageName, languageDirection) => this.props.actions.setAllLanguageInfoInProjectInformationReducer(languageId, languageName, languageDirection)}
                />
              </div>
              <div style={{flex: '1 1', margin: '10px', minWidth:'260px'}}>
                <TextPrompt
                  id={'resource_id'}
                  getErrorMessage={(text) => getResourceIdWarning.call(this, text)}
                  text={resourceId}
                  title={translate('projects.resource_id')}
                  updateText={(resourceId) => this.props.actions.setResourceIDInProjectInformationReducer(this.limitStringLength(resourceId, maxResourceIdLength))}
                  required={true}
                  infoText={getResourceInfoHint()}
                />
              </div>
              <div style={{flex: '1 1', margin: '10px', minWidth:'260px'}}>
                <LanguageIdTextBox
                  translate={translate}
                  languageId={languageId}
                  updateLanguageName={(languageName) => this.props.actions.setLanguageNameInProjectInformationReducer(languageName)}
                  updateLanguageId={(languageId) => this.props.actions.setLanguageIdInProjectInformationReducer(languageId)}
                  updateLanguageSettings={(languageId, languageName, languageDirection) => this.props.actions.setAllLanguageInfoInProjectInformationReducer(languageId, languageName, languageDirection)}
                />
              </div>
              <div style={{flex: '1 1', margin: '10px', minWidth:'260px'}}>
                <TextPrompt
                  id={'nickname'}
                  getErrorMessage={() => null}
                  text={nickname}
                  title={translate('projects.nickname')}
                  updateText={(nickname) => this.props.actions.setNicknameInProjectInformationReducer(nickname)}
                  required={false}
                  infoText={''}
                />
              </div>
              <div style={{flex: '1 1', margin: '10px', minWidth:'260px'}}>
                <LanguageDirectionDropdownMenu
                  translate={translate}
                  languageDirection={languageDirection}
                  updateLanguageDirection={(languageDirection) => this.props.actions.setLanguageDirectionInProjectInformationReducer(languageDirection)}
                />
              </div>
              <div style={{flex: '1 1', margin: '10px', minWidth:'260px'}}>
                <BookDropdownMenu
                  translate={translate}
                  bookId={bookId}
                  updateBookId={(bookId) => this.props.actions.setBookIDInProjectInformationReducer(bookId, true)}
                  developerMode={developerMode}
                />
              </div>
              <div style={{flex: '1 1', margin: '10px', minWidth:'260px'}}>
                <ContributorsArea
                  translate={translate}
                  contributors={contributors}
                  addContributor={this.addContributor.bind(this)}
                  removeContributor={this.removeContributor.bind(this)}
                  contributorsRequiredFieldMessage={this.state.contributorsRequiredFieldMessage}
                  updateContributorName={(contributorName, index) => {
                      this.setState({ contributorsRequiredFieldMessage: false });
                      this.props.actions.updateContributorName(contributorName, index);
                  }}
                />
              </div>
              <div style={{flex: '1 1', margin: '10px', minWidth:'260px'}}>
                <CheckersArea
                  translate={translate}
                  checkers={checkers}
                  addChecker={this.addChecker.bind(this)}
                  removeChecker={this.removeChecker.bind(this)}
                  checkersRequiredFieldMessage={this.state.checkersRequiredFieldMessage}
                  updateCheckerName={(checkerName, index) => {
                    this.setState({ checkersRequiredFieldMessage: false });
                    this.props.actions.updateCheckerName(checkerName, index);
                  }}
                />
              </div>
            </div>
          </Card>
      </ProjectValidationContentWrapper>
    );
  }
}

ProjectInformationCheck.propTypes = {
  translate: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
  reducers: PropTypes.object.isRequired
};

export default ProjectInformationCheck;

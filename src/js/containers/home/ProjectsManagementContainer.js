import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// components
import MyProjects from '../../components/home/projectsManagement/MyProjects';
import ProjectInstructions from '../../components/home/projectsManagement/projectInstructions';
import ProjectsFAB from '../../components/home/projectsManagement/ProjectsFAB';
import OnlineImportModal from '../../components/home/projectsManagement/OnlineImportModal';
// actions
import * as BodyUIActions from '../../actions/BodyUIActions';
import * as MyProjectsActions from '../../actions/MyProjects/MyProjectsActions';
import * as ImportOnlineSearchActions from '../../actions/ImportOnlineSearchActions';
import * as OnlineImportWorkflowActions from '../../actions/Import/OnlineImportWorkflowActions';
import * as CSVExportActions from '../../actions/CSVExportActions';
import * as ProjectUploadActions from '../../actions/ProjectUploadActions';
import * as USFMExportActions from '../../actions/USFMExportActions';
import * as OnlineModeConfirmActions from '../../actions/OnlineModeConfirmActions';
import * as ProjectInformationCheckActions from '../../actions/ProjectInformationCheckActions';
import * as LocalImportWorkflowActions from '../../actions/Import/LocalImportWorkflowActions';
import * as ProjectLoadingActions from '../../actions/MyProjects/ProjectLoadingActions';
import * as wordAlignmentActions from '../../actions/WordAlignmentActions';

class ProjectsManagementContainer extends Component {

  componentWillMount() {
    this.props.actions.getMyProjects();
    let instructions = <ProjectInstructions />;
    if (this.props.reducers.homeScreenReducer.homeInstructions !== instructions) {
      this.props.actions.changeHomeInstructions(instructions);
    }
  }

  render() {
    const {
      importOnlineReducer,
      myProjectsReducer,
      homeScreenReducer,
      loginReducer
    } = this.props.reducers;
    const myProjects = myProjectsReducer.projects;

    return (
      <div style={{ height: '100%' }}>
        <MyProjects myProjects={myProjects} user={loginReducer.userdata} actions={this.props.actions} />
        <div style={{ position: "absolute", bottom:"50px", right: "50px", zIndex: "999"}}>
          <ProjectsFAB
            homeScreenReducer={this.props.reducers.homeScreenReducer}
            actions={this.props.actions}
          />
        </div>
        <OnlineImportModal
          importOnlineReducer={importOnlineReducer}
          homeScreenReducer={homeScreenReducer}
          loginReducer={loginReducer}
          actions={this.props.actions}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    reducers: {
      importOnlineReducer: state.importOnlineReducer,
      homeScreenReducer: state.homeScreenReducer,
      myProjectsReducer: state.myProjectsReducer,
      loginReducer: state.loginReducer
    }
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      changeHomeInstructions: (instructions) => {
        dispatch(BodyUIActions.changeHomeInstructions(instructions));
      },
      toggleProjectsFAB: () => {
        dispatch(BodyUIActions.toggleProjectsFAB());
      },
      getMyProjects: () => {
        dispatch(MyProjectsActions.getMyProjects());
      },
      selectProject: (projectName) => {
        dispatch(ProjectLoadingActions.migrateValidateLoadProject(projectName));
      },
      selectLocalProject: () => {
        dispatch(LocalImportWorkflowActions.selectLocalProject());
      },
      exportToCSV: (projectPath) => {
        dispatch(CSVExportActions.exportToCSV(projectPath));
      },
      uploadProject: (projectPath, userdata) => {
        dispatch(ProjectUploadActions.uploadProject(projectPath, userdata));
      },
      exportToUSFM: (projectPath) => {
        dispatch(USFMExportActions.exportToUSFM(projectPath));
      },
      closeOnlineImportModal: () => {
        dispatch(BodyUIActions.closeOnlineImportModal());
      },
      openOnlineImportModal: () => {
        dispatch(OnlineModeConfirmActions.confirmOnlineAction(() => {
          dispatch(BodyUIActions.toggleProjectsFAB());
          dispatch(BodyUIActions.openOnlineImportModal());
        }));
      },
      handleURLInputChange: importLink => {
        dispatch(OnlineImportWorkflowActions.getLink(importLink));
      },
      loadProjectFromLink: () => {
        dispatch(OnlineImportWorkflowActions.onlineImport());
      },
      searchReposByUser: (user) => {
        dispatch(ImportOnlineSearchActions.searchReposByUser(user));
      },
      searchReposByQuery: (query) => {
        dispatch(ImportOnlineSearchActions.searchReposByQuery(query));
      },
      openOnlyProjectDetailsScreen: (projectSaveLocation) => {
        dispatch(ProjectInformationCheckActions.openOnlyProjectDetailsScreen(projectSaveLocation));
      },
      exportWordAlignmentData: (projectSaveLocation) => {
        dispatch(wordAlignmentActions.exportWordAlignmentData(projectSaveLocation));
      }
    }
  };
};

ProjectsManagementContainer.propTypes = {
  reducers: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectsManagementContainer);

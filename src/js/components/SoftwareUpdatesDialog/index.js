import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { getTranslate } from '../../selectors';
import appPackage from '../../../../package';
import axios from 'axios';
import os from 'os';
import semver from 'semver';
import SoftwareUpdatesDialog, {
  STATUS_ERROR, STATUS_OK, STATUS_LOADING, STATUS_UPDATE
} from './SoftwareUpdatesDialog';

/**
 * Returns the correct update asset for this operating system.
 * If the update is not newer than the installed version null will be returned.
 * @param {object} response the network response
 * @param {string} installedVersion the installed version of the application
 * @param {string} osArch the operating system architecture
 * @param {string} osPlatform the operating system.
 * @return {*} the update object
 */
export function getUpdateAsset(response, installedVersion, osArch, osPlatform) {
  const platformNames = {
    'aix': 'linux',
    'darwin': 'macos',
    'freebsd': 'linux',
    'linux': 'linux',
    'openbsd': 'linux',
    'sunos': 'linux',
    'win32': 'win'
  };
  const platform = `${platformNames[osPlatform]}-${osArch}`;
  let update = null;
  for (const asset of response.assets) {
    if (asset.label.includes(platform)) {
      update = {
        ...asset,
        latest_version: response.tag_name,
        installed_version: installedVersion
      };
      break;
    }
  }

  // validate version
  if(update) {
    const latest = semver.valid(semver.coerce(update.latest_version));
    const installed = semver.valid(semver.coerce(update.installed_version));
    if (!semver.gt(latest, installed)) update = null;
  }
  return update;
}

export class ConnectedSoftwareUpdatesDialog extends React.Component {

  constructor(props) {
    super(props);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.startSoftwareCheck = this.startSoftwareCheck.bind(this);
    this.stopSoftwareCheck = this.stopSoftwareCheck.bind(this);
    this.initialState = {
      status: STATUS_LOADING,
      update: null,
      cancelToken: null
    };
    this.state = {
      ...this.initialState
    };
  }

  componentWillReceiveProps(newProps) {
    const openChanged = newProps.open !== this.props.open;
    if(openChanged && newProps.open) {
      this.startSoftwareCheck();
    } else if(openChanged && !newProps.open) {
      this.stopSoftwareCheck();
    }
  }

  componentDidCatch(error, info) {
    console.error(error, info);
    this.stopSoftwareCheck();
  }

  componentWillUnmount() {
    this.stopSoftwareCheck();
  }

  /**
   * Initiates checking for software updates
   */
  startSoftwareCheck() {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();
    const request = {
      cancelToken: source.token,
      method: 'GET',
      url: `https://api.github.com/repos/unfoldingWord-dev/translationCore/releases/latest`
    };

    this.setState({
      ...this.initialState,
      cancelToken: source
    });

    this.request = axios(request).then(response => {
      const update = getUpdateAsset(response.data, appPackage.version, os.arch(), os.platform());
      if(update) {
        this.setState({
          ...this.state,
          status: STATUS_UPDATE,
          update
        });
      } else {
        this.setState({
          ...this.state,
          status: STATUS_OK
        });
      }
    }).catch(error => {
      if(axios.isCancel(error)) {
        // user canceled
        this.handleClose();
      } else {
        console.error(error);
        this.setState({
          ...this.state,
          status: STATUS_ERROR
        });
      }
    });
  }

  /**
   * Cancels the software update checks
   */
  stopSoftwareCheck() {
    const {cancelToken} = this.state;
    if(cancelToken !== null) {
      cancelToken.cancel('Operation canceled by user');
    }
  }

  handleClose() {
    const {onClose} = this.props;
    this.setState({
      ...this.initialState
    });
    onClose();
  }

  handleSubmit() {
    const {update} = this.state;
    if(update) {
      // TODO: download update
      console.log('downloading update');
    } else {
      this.handleClose();
    }
  }

  render() {
    const {open, translate} = this.props;
    const {status, update} = this.state;

    return (
      <SoftwareUpdatesDialog onClose={this.handleClose}
                             translate={translate}
                             open={open}
                             onSubmit={this.handleSubmit}
                             status={status}
                             update={update}/>
    );
  }
}

ConnectedSoftwareUpdatesDialog.propTypes = {
  translate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

const mapStateToProps = (state) => ({
  translate: getTranslate(state)
});

export default connect(mapStateToProps)(ConnectedSoftwareUpdatesDialog);

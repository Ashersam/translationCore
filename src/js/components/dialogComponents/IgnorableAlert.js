import React from 'react';
import BaseDialog from './BaseDialog';
import PropTypes from 'prop-types';
import { Checkbox } from 'material-ui';
import path from 'path-extra';

// import logo from "../../../images/TC_Icon.png";

/**
 * A generic alert dialog that can be ignored.
 */
class IgnorableAlert extends React.Component {
  constructor (props) {
    super(props);
    this.handleOnIgnore = this.handleOnIgnore.bind(this);
  }

  handleOnIgnore (e) {
    if (typeof this.props.onIgnore === 'function') {
      this.props.onIgnore(e.target.checked);
    }
  }

  render () {
    const {
      title,
      children,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      open,
      ignoreText,
      onIgnore
    } = this.props;

    const padding = 25;
    const isIgnorable = ignoreText && typeof onIgnore === 'function';

    const logoPath = path.join(__dirname, '../../../images/TC_Icon.png');

    return (
      <BaseDialog
        open={open}
        title={title}
        primaryLabel={confirmText}
        onSubmit={onConfirm}
        secondaryLabel={cancelText}
        onClose={onCancel}
        scrollableContent={true}
        bodyStyle={{ padding: padding }}
        titleStyle={{ marginBottom: 0 }}
      >
        <div style={{ display: 'flex' }}>
          <img
            src={logoPath}
            height="100px"
            width="115px"
            alt="translationCore Logo"
            style={{ paddingRight: padding }}
          />

          <div style={{ color: 'var(--text-color-dark)', flexGrow: 1 }}>
            {children}
            {isIgnorable ? (
              <Checkbox
                onCheck={this.handleOnIgnore}
                style={{ paddingTop: padding }}
                iconStyle={{ fill: 'black', marginRight: 5 }}
                label={ignoreText}
              />
            ) : null}
          </div>
        </div>
      </BaseDialog>
    );
  }
}

IgnorableAlert.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  confirmText: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  cancelText: PropTypes.string,
  onCancel: PropTypes.func,
  onIgnore: PropTypes.func,
  ignoreText: PropTypes.string,
  children: PropTypes.any
};

export default IgnorableAlert;

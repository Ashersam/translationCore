import React from 'react';
import PropTypes from 'prop-types';
import {Checkbox} from 'material-ui';

const ToolCardBoxes = ({checks, onChecked, selectedCategories, toolName}) => {
  let checkBoxNames = {};
console.log( "toolName", toolName );

  if( toolName === "translationWords") {
    checkBoxNames = {
      'kt': 'Key Terms',
      'names': 'Names',
      'other': 'Other Terms'
    };
  } else {
    checkBoxNames = {
      'num': 'Numbers',
      'fig': 'Figures of Speech'
    };
  }

  const sortedChecks = checks.sort((a, b) => {
    return Object.keys(checkBoxNames).indexOf(a) > Object.keys(checkBoxNames).indexOf(b);
  });
  
  return (
    <div style={{marginLeft: '6%'}}>
      {
        //checkBoxNames.map((id, index) => (
        sortedChecks.map((id, index) => (
          <div style={{display: 'flex', alignItems: 'center', marginBottom: 5}} key={index}>
            <Checkbox
              style={{width: 'unset'}}
              iconStyle={{fill: 'black', marginRight: 12}}
              checked={selectedCategories.includes(id)}
              onCheck={(e) => {
                onChecked(id, e.target.checked, toolName);
              }}
            />
            <div>{checkBoxNames[id] || id}</div>
          </div>
        ))
      }
    </div>
  );
};

ToolCardBoxes.propTypes = {
  checks: PropTypes.array.isRequired,
  onChecked: PropTypes.func,
  selectedCategories: PropTypes.array.isRequired,
  toolName: PropTypes.string.isRequired
};

export default ToolCardBoxes;

const React = require('react');
const Modal = require('react-bootstrap/lib/Modal.js');
const api = window.ModuleApi;
const CoreActionsRedux = require('../actions/CoreActionsRedux.js');
const { Tabs, Tab } = require('react-bootstrap/lib');

class ToolsModalContainer extends React.Component {
    render() {
        return (
          <div>
            <Tabs defaultActiveKey={1} id="uncontrolled-tab-example"
                  bsStyle="pills"
                  style={{borderBottom: "none", backgroundColor: "#5C5C5C", color: '#FFFFFF', width: "100%"}}>
              <Tab eventKey={1} title="Available Tools" style={{backgroundColor: "#333333"}}>

              </Tab>
              <Tab eventKey={2} title="Online Tools" style={{backgroundColor: "#333333"}}>

              </Tab>
            </Tabs>
          </div>
        )
    }
}

module.exports = ToolsModalContainer;
(function() {
  const ReactDOM = require('react-dom');
  const React = require('react');
// var db = require('./db-init');
  const FileUpload = require('./fileupload');
  const remote = window.electron.remote;
  const {Menu} = remote;
  const menubar = require('./menubar');
  const CommentBox = require('./CommentBox');

  var App = {
    init: function() {
      var menu = Menu.buildFromTemplate(menubar.template);
      Menu.setApplicationMenu(menu);
      ReactDOM.render(<CommentBox />, document.getElementById('content'));
    }
  };

  window.App = App;
})();
document.addEventListener('DOMContentLoaded', App.init);

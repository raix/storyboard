Package.describe({
  git: 'https://github.com/raix/storyboard.git',
  name: 'raix:storyboard',
  version: '0.0.2',
  summary: "Adds the concepts of Storyboard, Viewports and Screens"
});

Package.onUse(function(api) {
  if (api.versionsFrom) {

    api.versionsFrom('1.0');

    api.use(['ui', 'templating', 'session', 'underscore', 'deps']);
    api.addFiles([
      'viewport.css',
      'viewport.html',
      'viewport.js',
    ], 'client');
    api.export('ViewPort');
    api.export('Transition');

  } else {

    api.use(['ui', 'templating', 'session', 'underscore', 'deps']);
    api.addFiles([
      'viewport.css',
      'viewport.html',
      'viewport.js',
    ], 'client');
    api.export('ViewPort');
    api.export('Transition');

  }
});

Package.onTest(function(api) {

});
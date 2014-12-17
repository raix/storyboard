Package.describe({
  name: 'raix:storyboard',
  version: '0.0.1',
  summary: "Adds the concepts of Storyboard, Viewports and Screens"
});

Package.on_use(function(api) {
  if (api.versionsFrom) {

    api.versionsFrom('1.0');

    api.use(['ui', 'templating', 'session', 'underscore', 'deps']);
    api.add_files([
      'viewport.css',
      'viewport.html',
      'viewport.js',
    ], 'client');
    api.export('ViewPort');
    api.export('Transition');

  } else {

    api.use(['ui', 'templating', 'session', 'underscore', 'deps']);
    api.add_files([
      'viewport.css',
      'viewport.html',
      'viewport.js',
    ], 'client');
    api.export('ViewPort');
    api.export('Transition');

  }
});

Package.on_test(function(api) {

});
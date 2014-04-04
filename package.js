Package.describe({
  summary: "Adds the concepts of Storyboard, Viewports and Screens"
});

Package.on_use(function(api) {
  api.use(['ui', 'templating', 'session', 'underscore', 'deps']);
  api.add_files([
    'viewport.css',
    'viewport.html',
    'viewport.js',
  ], 'client');
  api.export('ViewPort');
});

Package.on_test(function(api) {

});
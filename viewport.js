
var _reactiveEntity = function(defaultValue) {
  var self = this;
  var value = defaultValue;
  var dep = new Deps.Dependency();

  self.get = function () {
    dep.depend();
    return value;
  };

  self.set = function(newValue) {
    if (newValue !== value) {
      value = newValue;
      dep.changed();
    }
  };
};

var _viewports = {};


/**
 * @method ViewPort
 * @param {string} viewportId Id of the viewport
 * @param {string | null} [tempName] Show the template
 * @param {string} [toClass] transform to class
 * @param {string} [fromClass] transform from class
 * @param {string} [steps] fromClass transform steps before template is removed
 */
ViewPort = function(viewportId, tempName, toClass, fromClass, steps) {
  if (viewportId && (tempName || tempName === null )) {

    // Test if current is a or b
    var source = ViewPort(viewportId);

    // Reverse current (make sure its booleans)
    source.a.isCurrent = !source.a.isCurrent;
    source.b.isCurrent = !source.a.isCurrent;

    var current = (source.a.isCurrent)? source.a : source.b;
    var last = (source.b.isCurrent)? source.a : source.b;

    // Store to/from classes
    current.toClass = toClass || '';
    current.fromClass = fromClass || '';
    current.steps = steps || 1;

    // Remove the last template
    last.show.set(null);

    // Set the new template name
    current.show.set(tempName);

  } else {

    if (typeof _viewports[viewportId] !== 'undefined') {
      return _viewports[viewportId];
    } else {
      return _viewports[viewportId] = {
        'a': {
          show: new _reactiveEntity(null),
          temp: new _reactiveEntity(null),
          isCurrent: true,
        },
        'b': {
          show: new _reactiveEntity(null),
          temp: new _reactiveEntity(null),
          isCurrent: true,     
        },
      };
    }
    
  }
};

Template.screen.content = function() {
  // If source then return the template else return null
  return ViewPort(this.id)[this.name].temp.get();
};

Template.screen.showcontent = function(viewportId, name) {
  // Get the screen
  var screen = ViewPort(viewportId)[name];
  // Get the source 
  var source = screen.show.get();
  if (source) {
    // Show the template
    screen.temp.set(source && Template[source] || null);
    return screen.toClass;
  } else {
    return screen.fromClass;
  }
};

Template.screen.events({
  'transitionend/webkitTransitionEnd/oTransitionEnd/MSTransitionEnd div': function(evt) {
    // Get screen
    var current = ViewPort(this.id)[this.name];

    // None in transit
    if (!current.isCurrent && current.temp.get()) {
      current.steps--;
      if (current.steps === 0) {      
        console.log('removed template');
        // Remove the template contents
        current.temp.set(null);
      }
    }

  }
});
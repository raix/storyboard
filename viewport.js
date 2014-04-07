
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

UI.registerHelper('ViewPort', {
  on: function(id, tempName, result) {
    var current = ViewPort(id).current.get();
    if (current && current.show.get() == tempName || current === tempName) {
      // We are showing the template
      return (typeof result === 'undefined')? true : result;
    } else {
      // We are not showing the template
      return (typeof result === 'undefined')? false : null;
    }
  },
  off: function(id, tempName, result) {
    var current = ViewPort(id).current.get();
    if (current && current.show.get() == tempName || current === tempName) {
      // We are not showing the template
      return (typeof result === 'undefined')? false : null;
    } else {
      // We are showing the template
      return (typeof result === 'undefined')? true : result;
    }
  },
  Session: function(id, name) {
    return ViewPort(id).Session(name);
  }
});

// Set pr. viewport / template events
_viewportEvents = function(tempName, events) {
  var self = this;
  if (typeof events === 'undefined') {

    if (tempName === ''+tempName || tempName === null) {
      // TempName is string 
      // We act as a getter
      return self._events[tempName] || {};
    } else {
      // TempName must be the master / empty viewport events...
      _viewportEvents.call(self, null, tempName);
    }

  } else if (events === null) {

    // If events are null then reset the events on this viewport
    delete self._events[tempName];

  } else {

    // We extend and overwrite events
    self._events[tempName] = _.extend(self._events[tempName] || {}, events);

  }
};

_emitEvent = function(name /* params */) {
  var self = this;
  var args = Array.prototype.slice.call(arguments);
  var name = args.shift();

  var f =  self._activeEvents[name] || self.events(null)[name];

  if (typeof f === 'function') {
    // Looks like we have a function
    f.apply(self, args);
  }
};

_session = function(name, value) {
  var self = this;
  self._sessionVars[name] = self._sessionVars[name] || new _reactiveEntity(value);

  if (typeof value === 'undefined') {
    return self._sessionVars[name].get();
  } else {
    return self._sessionVars[name].set(value);
  }
};

_sessionToggle = function(name, value) {
  var self = this;
  var currentValue = self.Session(name);
  if (currentValue == value) {
    // Unset the value
    self.Session(name, null);
  } else {
    // Set the value
    self.Session(name, value);
  }
};

_goTo = function(tempName, settings) {
  // Test if current is a or b
  var self = this;

  var options = _.extend({
    // Toggle eg. if the template is already displayed it will be hidden
    toggle: true,
    // Class transforming to
    inTo: {
      'class': null,
      //'style': null,
      layer: 0
    },
    // Class transforming out
    outFrom: {
      'class': null,
      //'style': null,
      layer: 0
    },
    // Steps before the template is removed
    // XXX: We could perhaps have a timeout on this?
    steps: 1,
    // Delay before transforming away the last screen
    delay: 0,
  }, settings);


  // Reverse current (make sure its booleans)
  self.a.isCurrent = !self.a.isCurrent;
  self.b.isCurrent = !self.a.isCurrent;

  var current = (self.a.isCurrent)? self.a : self.b;
  var last = (self.b.isCurrent)? self.a : self.b;

  // Store to/from classes
  current.inTo = options.inTo['class'] || null;
  current.outFrom = options.outFrom['class'] || null;
  current.steps = options.steps;

  // Set the layer
  last.layer.set(options.outFrom.layer);
  current.layer.set(options.inTo.layer);

  // Set the template
  if (last && last.show.get() == tempName && options.toggle) {
    // Set current to null
    self.set(null);
    // Remove the last template
    last.show.set(null);
  } else {
    // Set the current
    self.set(tempName);

    if (options.delay) {
      Meteor.setTimeout(function() {
        // Remove the last template
        last.show.set(null);
      }, options.delay);
    } else {
      // Remove the last template
      last.show.set(null);
    }
  }


};

_set = function(tempName) {
  var self = this;
  // The current
  var current = (self.a.isCurrent)? self.a : self.b;

  // Extend the events with template specifics
  _.extend(self._activeEvents, self.events(tempName));

  // Set the new tempate
  self.currentName.set(tempName);
  self.current.set(current);
  current.show.set(tempName);   
};

// TODO: _current return the current?

/**
 * @method ViewPort
 * @param {string} viewportId Id of the viewport
 * @param {string | null} [tempName] Show the template
 * @param {string} [inTo] transform to class
 * @param {string} [outFrom] transform from class
 * @param {string} [steps] outFrom transform steps before template is removed
 */
ViewPort = function(viewportId, defaultTemp) {
  // Return the viewport object
  if (typeof _viewports[viewportId] !== 'undefined') {
    return _viewports[viewportId];
  } else {
    return _viewports[viewportId] = {
      id: viewportId,
      'a': {
        show: new _reactiveEntity(defaultTemp || null),
        temp: new _reactiveEntity(null),
        isCurrent: true,
        layer: new _reactiveEntity(null),
      },
      'b': {
        show: new _reactiveEntity(null),
        temp: new _reactiveEntity(null),
        isCurrent: (defaultTemp)? false: true,     
        layer: new _reactiveEntity(null),
      },
      // Current object
      current: new _reactiveEntity(null),
      // Current template name
      currentName: new _reactiveEntity(null),      
      // Active events
      _activeEvents: {},
      // Session vars
      _sessionVars: {},
      // Event map pr. template
      _events: {},
      // Helper functions
      events: _viewportEvents,
      // Emit an event on the viewport
      emit: _emitEvent,
      // Goto
      goTo: _goTo,
      // Set the current template
      set: _set,
      // Get setter for sessions
      Session: _session,
      // Toggle session
      toggleSession: _sessionToggle
    };
  }

};

ViewPort.emit = function() {
  var self = this;
  var args = Array.prototype.slice.call(arguments);
  var name = args.shift();

  _.each(_viewports, function(vp, viewportName) {

    var f =  vp._activeEvents[name] || vp.events(null)[name];

    if (typeof f === 'function') {
      // Looks like we have a function
      try {
        f.apply(vp, args);
      } catch(err) {
        console.error('ViewPort.emit failed to call "' + name +
                '" event handler on viewport "' + viewportName +
                '", Error: ' + err.message);
      }
    }  

  });
};

Template.screen.Session = function(name) {
  // If source then return the template else return null
  // XXX: Bugger this cant be passed down... we mount it directly
  return ViewPort(this.id).Session(name);
};

Template.screen.content = function() {
  // If source then return the template else return null
  return ViewPort(this.id)[this.name].temp.get();
};

Template.screen.showlayer = function() {
  var self = this;
  // Get the screen
  var screen = ViewPort(self.id, self.defaultTemp)[self.name];
  // Get the source 
  var layer = screen.layer.get();

  return (layer === null)? null: 'z-index: ' + layer + ';';
};


Template.screen.showcontent = function() {
  var self = this;
  // Get the screen
  var screen = ViewPort(self.id, self.defaultTemp)[self.name];
  // Get the source 
  var source = screen.show.get();

  if (source) {
    if (source && Template[source] && !Template[source].Session) {
      // If template dont have a Session helper we add one
      Template[source].Session = Template.screen.Session;
    }
    // Show the template
    screen.temp.set(source && Template[source] || null);
    return screen.inTo;
  } else {
    return screen.outFrom;
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
        // console.log('removed template');
        // Remove the template contents
        current.temp.set(null);
      }
    }

  }
});
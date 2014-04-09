
var _reactiveEntity = function(defaultValue) {
  var self = this;
  self.value = defaultValue;
  var dep = new Deps.Dependency();

  self.get = function () {
    dep.depend();
    return self.value;
  };

  self.set = function(newValue) {
    if (newValue !== self.value) {
      self.value = newValue;
      dep.changed();
    }
  };
};

var _viewports = {};

Transition = {};

defaultTransition = {};

UI.registerHelper('Transition', Transition);

var transition = function(value) {
  if (!value) return '';

  return '-webkit-transition: ' + value + ';' +
  '-moz-transition: ' + value + ';' +
  '-o-transition: ' + value + ';' +
  'transition: ' + value + ';';
};

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

_defaultTransition = function(options) {
  return _.extend({
    // Toggle eg. if the template is already displayed it will be hidden
    toggle: true,
    // Class transforming to
    inTo: {
      'class': null,
      //'style': null,
      layer: 0,
      transition: ''
    },
    // Class transforming out
    outFrom: {
      'class': null,
      //'style': null,
      layer: 0,
      transition: ''
    },
    delay: false,
  }, options);
  
};

_setDefault = function(tempName, inFromOpt, outToOpt) {
  var self = this;

  // Set the default template and transitions
  defaultTransition[self.id] = {
    tempName: tempName,
    inFrom: inFromOpt,
    outTo: outToOpt
  };

  self.set(tempName, inFromOpt);

};

_goTo = function(tempNameOpt, inFromOpt, outToOpt) {
  ViewPort.debug && console.log('GOTO:', tempName, inFromOpt, outToOpt);
  // Test if current is a or b
  var self = this;
  var current, last;

  // Set default options
  var inFrom = _defaultTransition(inFromOpt);
  // If not set use the inFrom transition
  var outTo = outToOpt && _defaultTransition(outToOpt) || self.transition && _defaultTransition(self.transition) || inFrom;


  // Determin if we are toggling this viewport
  var toggle = (tempNameOpt === self.currentName.value && inFrom.toggle);

  // Set the tempName, depending on the toggle flag
  var tempName = (toggle) ? null : tempNameOpt;

  if (tempName === null) {
    // Check if we have set a default transition on this one...
    if (defaultTransition[self.id]) {

      // Set new tempName
      tempName = defaultTransition[self.id].tempName;

      // Set new inFrom if set
      if (defaultTransition[self.id].inFrom) {
        inFrom = _defaultTransition(defaultTransition[self.id].inFrom);
      }

      // Set new outTo if set
      if (defaultTransition[self.id].outTo) {
        outTo = _defaultTransition(defaultTransition[self.id].outTo);
      }
      
    }
  }

  // Set the last transition
  self.transition = inFrom;

  // Parse the transition
  var stepsIn = inFrom.inTo.transition.split('s');
  var stepsOut = outTo.outFrom.transition.split('s');

  // Cut the left overs
  stepsIn.pop();
  stepsOut.pop();

  var durationIn = [];
  var durationOut = [];

  // push the durations into array
  _.each(stepsIn, function(t) {
    durationIn.push(+t.split(' ').pop());
  });

  // push the durations into array
  _.each(stepsOut, function(t) {
    durationOut.push(+t.split(' ').pop());
  });

  // Calculate the max durations
  var maxDurationIn = stepsIn.length && Math.max.apply({}, durationIn) || 0;
  var maxDurationOut = stepsOut.length && Math.max.apply({}, durationOut) || 0;

  ViewPort.debug && console.log(durationIn, durationOut);
  ViewPort.debug && console.log(maxDurationIn, maxDurationOut);


  function clearTransitionTimeout() {
    if (self.inTransition) {

      // Stop all timeouts - make sure we dont get interupted in the new animation
      _.each(self.inTransition, function(id) {
        // Clear the time out
        Meteor.clearTimeout(id);
      });

    }
    
    self.inTransition = [];
  }

  function transitionTimeout(f, delay) {
    self.inTransition.push(Meteor.setTimeout(f, delay));
  }

  function getCurrentAndLastScreens() {
    // Reverse current (make sure its booleans)
    self.a.isCurrent = !self.a.isCurrent;
    self.b.isCurrent = !self.a.isCurrent;


    // Get last / current handles
    if (self.a.isCurrent) {
      current = self.a;
      last = self.b;
    } else {
      current = self.b;
      last = self.a;
    }
  }

  function renderStartPosition() {  
    // Store to/from classes
    current.inTo = inFrom.inTo['class'];
    current.outFrom = inFrom.outFrom['class'];

    last.inTo = outTo.inTo['class'];
    last.outFrom = outTo.outFrom['class'];

    // Set start
    last.start.set(last.outFrom);
    current.start.set(current.outFrom);  

    // Set the layer
    current.layer.set(inFrom.inTo.layer);
    last.layer.set(outTo.outFrom.layer);

    // Set transistions
    current.transition.set(inFrom.inTo.transition);
    last.transition.set(outTo.outFrom.transition);
  };

  function resetTransition() {
    // var current = vp.current.get();
    // var last = vp.last.get();

    ViewPort.debug && console.log('Reset', self.id, tempName);    
    // ViewPort.debug && console.log('removed template');
    // Remove the template contents
    last.temp.set(null);

    // Remove transition, if we want to move later
    // XXX: Note these does not make the big difference
    // last.transition.set(null);
    // current.transition.set(null);

    // Reset start
    last.start.set(null);
  };

  function removeTheLastTemplate() {
    self.emit('done', tempName);

    last.show.set(null);  
    
    // Delay until template is out
    var delay = ((maxDurationOut) * 1000 );

    transitionTimeout(resetTransition, delay);
  }

  function renderTransition() {    
    // Set the current
    self.set(tempName);

    // Use the outTo delay before removing the last
    // We only delay if the transition is the same
    if (!outToOpt && outTo.delay) {

      var delay = (outTo.delay === true)? (maxDurationIn * 1000 ) : outTo.delay;

      if (toggle) delay = 0;

      ViewPort.debug && console.log('RENDER DELAY ', tempName, delay, self.last.get());
      // Remove the last template a bit delayed
      transitionTimeout(removeTheLastTemplate, delay);

    } else {

      ViewPort.debug && console.log('RENDER DIRECTLY ', tempName, self.last.get().temp.get());

      // Remove the last template
      removeTheLastTemplate();

    }
    
  } // EO renderTransition

  // 1. Stop all transitions
  clearTransitionTimeout();

  // 2. Get the current and last screen to work with
  getCurrentAndLastScreens();

  // 3. Render the start position for the transition
  renderStartPosition();

  // 4. Delay just a bit to let DOM follow up on this before starting the
  // transition
  transitionTimeout(renderTransition, 20);

};

_set = function(tempName, transition) {
  var self = this;
  // The current
  var current = (self.a.isCurrent)? self.a : self.b;
  var last = (self.a.isCurrent)? self.b : self.a;

  // We could be setting the basics for this viewport
  if (transition) {
    var t = _defaultTransition(transition);
    current.inTo = t.inTo['class'];

    // Set the last transition
    self.transition = t;
  }

  // Extend the events with template specifics
  _.extend(self._activeEvents, self.events(tempName));
    // Set the new tempate
    self.currentName.set(tempName);
    self.current.set(current);
    self.last.set(last);
    current.show.set(tempName);
};

/**
 * @method ViewPort
 * @param {string} viewportId Id of the viewport
 */
ViewPort = function(viewportId) {
  // Return the viewport object
  if (typeof _viewports[viewportId] !== 'undefined') {
    return _viewports[viewportId];
  } else {
    return _viewports[viewportId] = {
      id: viewportId,
      'a': {
        show: new _reactiveEntity(null),
        temp: new _reactiveEntity(null),
        isCurrent: true,
        layer: new _reactiveEntity(null),
        start: new _reactiveEntity(null),
        transition: new _reactiveEntity(null)
      },
      'b': {
        show: new _reactiveEntity(null),
        temp: new _reactiveEntity(null),
        isCurrent: false,     
        layer: new _reactiveEntity(null),
        start: new _reactiveEntity(null),
        transition: new _reactiveEntity(null)
      },
      // Current object
      current: new _reactiveEntity(null),
      // Current object
      last: new _reactiveEntity(null),
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
      toggleSession: _sessionToggle,
      // Set default template
      setDefault: _setDefault
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
  var screen = ViewPort(self.id)[self.name];
  // Get the source 
  var layer = screen.layer.get();
  // Get the transistion
  var tr = screen.transition.get();
  // create the result
  var result = (layer === null)? '': 'z-index: ' + layer + ';';
  // Add transition
  result += transition(tr);

  return (result === '')? null: result;
};

Template.screen.startPosition = function() {
  var self = this;
  // Get the screen
  var screen = ViewPort(self.id)[self.name];

  return screen.start.get();
};

Template.screen.showcontent = function() {
  var self = this;
  // Get the screen
  var screen = ViewPort(self.id)[self.name];
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
    return null; // screen.outFrom;
  }
};
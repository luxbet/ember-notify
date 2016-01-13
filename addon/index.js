import Ember from 'ember';

function aliasToShow(type, options) {
  return function(message, userOptions) {
    Ember.merge(options, userOptions);
    return this.show(type, message, options);
  };
}

var Notify = Ember.Object.extend({

  info: aliasToShow('info', {closeAfter: 5000}),
  success: aliasToShow('success', {closeAfter: 5000}),
  warning: aliasToShow('warning', {closeAfter: 15000}),
  alert: aliasToShow('alert'),
  error: aliasToShow('error', {closeAfter: 20000}),

  init: function() {
    this.pending = [];
  },

  show: function(type, message, options) {
    if (typeof message === 'object') {
      options = message;
      message = null;
    }
    message = Ember.merge({
      message: message,
      type: type
    }, options);
    var target = this.get('target');
    var promise;
    if (target) {
      var messageObj = target.show(message);
      promise = Ember.RSVP.resolve(messageObj);
    }
    else {
      promise = new Ember.RSVP.Promise(function(resolve) {
        this.pending.push({
          message: message,
          resolve: resolve
        });
      }.bind(this));
    }
    return MessagePromise.create({
      message: message,
      promise: promise
    });
  },

  create: function(component) {
    return Notify.create({
      target: component
    });
  },

  target: Ember.computed({
  	set: function (key, val) {
  		this.showPending(val);
  		return val;
  	}
  }),

  showPending: function(target) {
    this.pending.map(function(pending) {
      var messageObj = target.show(pending.message);
      pending.resolve(messageObj);
    });
    this.pending = [];
  }

}).reopenClass({
  // set to true to disable testing optimizations that are enabled when
  // Ember.testing is true
  testing: false
});

export default Notify.extend({
  property: function() {
    return Ember.computed(function() {
      return Notify.create();
    });
  },
  create: function() {
    return Notify.create();
  },
  target: Ember.computed({
  	set: function(key, val) {
  		Ember.assert("Only one {{ember-notify}} should be used without a source property. " +
  		  "If you want more than one then use {{ember-notify source=someProperty}}",
  		  !this._primary || this._primary.get('isDestroyed')
  		);
  		this.showPending(val);
  		return val;
  	}
  }),

}).create();

var MessagePromise = Ember.ObjectProxy.extend(Ember.PromiseProxyMixin, {
  set: function(key, val) {
    // if the message hasn't been displayed then set the value on the message hash
    if (!this.get('content')) {
      this.message[key] = val;
      return this;
    }
    else {
      return this._super(key, val);
    }
  }
});

(function() {
  var recur = 1; // prevent recursive reference;

  function clearValue(target, value) {
    target(value);
    target.hasError(false);
    target.errorMessage('');
  }

  function addValidation(target) {
    if (target.validate) return;

    target.validators = [];
    target.hasError = ko.observable();
    target.errorMessage = ko.observable();

    var initValue = target();

    target.Clear = function() {
      clearValue(target, initValue);
    };

    target.clearError = function(){
      target.hasError(false);
      target.errorMessage('');
    };

    target.validate = function(newValue) {
      if (!arguments.length) newValue = target();

      for (var v in target.validators) {
        if (!target.validators[v](newValue)) return false;
      }
      return true;
    };

    target.validatePattern = function(newValue){
      if (!arguments.length) newValue = target();

      for (var v in target.validators) {
        if(target.validators[v].name === 'validatePattern'){
          if (!target.validators[v](newValue)) return false;
        }
      }
      return true;
    };

    target.subscribe(function(newValue) {
      target.validate(newValue);
    });
  }

  function isBuiltInObject(obj) {
    if (typeof obj != 'object' && typeof obj != 'function') return true;
    if (obj instanceof String || obj instanceof Boolean) return true;
    if (obj instanceof Number || obj instanceof Date) return true;

    return false;
  }

  function clear(model) {
    if (model.__recur__ === recur) return;
    
    model.__recur__ = recur;

    if (typeof model.Clear == 'function') {
      model.Clear();
      return;
    }

    for (var p in model) {
      if (isBuiltInObject(model[p])) continue;
      clear(model[p]);
    }
  }

  function validate(model) {
    if (model.__recur__ === recur) return true;

    model.__recur__ = recur;
    
    if (typeof model.hasToValidate == 'function') {
      if (!model.hasToValidate()) return true;
    }
    
    if (typeof model.validate == 'function') return model.validate();
    
    var isValid = true;
    for (var p in model) {
      if (isBuiltInObject(model[p]) || !ko.isObservable(model[p])) continue;
      if (!validate(model[p])) isValid = false;
    }
    return isValid;
  }

  ko.extenders.required = function(target, config) {
    if (!target || !config) throw 'target and config values can not be null';
    
    addValidation(target);

    var message =  config.message || 'This field is required';

    function validate(newValue) {
      if (newValue && typeof newValue === 'string') newValue = newValue.trim();
      target.hasError(newValue ? false : true);
      target.errorMessage(newValue ? '' : message);
      return !!newValue;
    }

    target.validators.push(validate);

    return target;
  };

  ko.extenders.pattern = function(target, config) {
    if (!target || !config || !config.pattern) throw 'target and config and config.pattern values can not be null';

    addValidation(target);

    var message = cfg.message || 'This field is invalid';
    var pattern = typeof config.pattern === 'string' ? 
    new RegExp(config.pattern) : config.pattern instanceof RegExp ?
    config.pattern : '';

    function validatePattern(newValue) {
      var valid = pattern.test(newValue);
      target.hasError(!valid);
      target.errorMessage(valid ? '' : message);

      return valid;
    }

    target.validators.push(validatePattern);

    return target;
  };

  ko.extenders.rule = function(target, config) {
    if (!target || !config || !config.rule) throw 'target and config and config.rule values can not be null';
    addValidation(target);

    var message = config.message || 'This field is invalid';

    function validate(newValue) {
      var valid = typeof config.rule === 'function' ? config.rule() : config.rule;
      target.hasError(!valid);
      target.errorMessage(message);
      return valid;
    }

    target.validators.push(validate);

    return target;
  };

  ko.utils.validate = function(viewModel) {
    recur++;
    return validate(viewModel);
  };

  ko.utils.clear = function(viewModel) {
    recur++;
    clear(viewModel);
  };

  ko.utils.getInvalids = function(viewModel) {
    var result = [];
    for (var property in viewModel) {
      if (viewModel[property].hasError && viewModel[property].hasError()) result.push(property);
    }
    return result;
  };

})();

function ViewModel(){
  var self = this;

  this.name = ko.observable().extend({required: {}});
}


window.vm = new ViewModel();
ko.applyBindings(window.vm);
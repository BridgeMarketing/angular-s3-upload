'use strict';

var directives = angular.module('app.directives', []);

directives.directive('file', function() {
  return {
    restrict: 'AE',
    scope: {
      file: '@'
    },
    link: function(scope, el, attrs){
      el.bind('change', function(event){
        var files = event.target.files;
        var file = files[0];
        scope.file = file;
        scope.$parent.file = file;
        scope.$apply();
      });
    }
  };
}) .directive('googleSignInButton',function(){
    return {
        scope:{
            buttonId:'@',
            options:'&'
        },
        template: '<div></div>',
        link: function(scope, element, attrs){
            var div = element.find('div')[0];
            div.id=attrs.buttonId;
            gapi.signin2.render(div.id,scope.options());//render a google button, first argument is an id, second options
        }
    };
});
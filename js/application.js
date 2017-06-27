'use strict';

var app = angular.module('app', [
    'app.services',
    'app.controllers',
    //'app.filters',
    'app.directives',
    'ngRoute'
]).config(['$routeProvider', function ($routeProvider) {

    $routeProvider
        .when("/login", {
            templateUrl: "views/login.html",
            controller: "loginController"
        })

        .when("/", {
            templateUrl: "views/upload.html",
            controller: "uploadController"
        })

        .otherwise({redirectTo: '/'});
}]).constant("config", {
    BucketName: 'bridge-js-dev',
    BucketRegion: 'us-east-1',
    IdentityPoolId: 'todo',
    UserPoolId: 'us-east-1_Wlk37rDtN',
    ClientId : '1iall4mjj9kgta6vbucrjo0o6'
});


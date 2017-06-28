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
            templateUrl: "views/main.html",
            controller: "mainController"
        })

        .otherwise({redirectTo: '/'});
}]).constant("config", {
    BucketName: 'bridge-js-dev',
    BucketRegion: 'us-east-2',
    PoolRegion: 'us-east-1',
    IdentityPoolId: 'us-east-1:0de6bc90-61f4-4d76-b927-4df919aaadaf',
    UserPoolId: 'us-east-1_Wlk37rDtN',
    ClientId : '1iall4mjj9kgta6vbucrjo0o6'
});


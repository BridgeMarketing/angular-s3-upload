'use strict';

var controllers = angular.module('app.controllers', []);


controllers.controller('loginController', ['$scope', 'config', '$location', 'User', function ($scope, config, $location, User) {
    $scope.user_id = 'lev.savranskiy@thebridgecorp.com';
    $scope.password = '';
    $scope.loading = false;
    var cognitoUser = User.getSessionUser();

    console.log('cognitoUser');
    console.log(cognitoUser);

    if (cognitoUser !== null) {
        window.location = '/#/';
    }

    $scope.login = function () {
        $scope.loading = true;
        $scope.message = '';
        var authenticationData = {
            Username: $scope.user_id,
            Password: $scope.password
        };
        var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
        var poolData = {
            UserPoolId: config.UserPoolId,
            ClientId: config.ClientId
        };
        var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
        var userData = {
            Username: $scope.user_id,
            Pool: userPool
        };
        var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);


        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                //  console.log(result);
                // console.log('access token + ' + result.getAccessToken().getJwtToken());
                /*Use the idToken for Logins Map when Federating User Pools
                 with Cognito Identity or when passing through an
                 Authorization Header to an API Gateway Authorizer*/

                // $scope.idToken = result.idToken.jwtToken;
                // console.log('idToken + ' + $scope.idToken);
                // $scope.message = $scope.idToken;
                // $scope.color = 'green';
                // $scope.loading = false;
                // $scope.$apply();
                //$location.path('/zzz');
                window.location = '/#/';
                //localStorage['CognitoIdentityServiceProvider.1iall4mjj9kgta6vbucrjo0o6.LastAuthUser']

            },

            onFailure: function (err) {
                console.error('error');
                console.log(err);
                $scope.color = 'red';
                $scope.message = err.toString();
                $scope.loading = false;
                $scope.$apply();
            },

            newPasswordRequired: function (userAttributes, requiredAttributes) {
                //just reset password with same passwor for now
                //todo real reset?
                // User was signed up by an admin and must provide new
                // password and required attributes, if any, to complete
                // authentication.

                // the api doesn't accept this field back
                delete userAttributes.email_verified;

                // Get these details and call
                cognitoUser.completeNewPasswordChallenge($scope.password, userAttributes, this);
            }

        });

    }


}]);


controllers.controller('uploadController', ['$scope', '$location', 'User', function ($scope, $location, User) {

    $scope.cognitoUser = User.getSessionUser();

    console.log('cognitoUser');
    console.log($scope.cognitoUser);

    if ($scope.cognitoUser === null) {
        $location.path('/login');
    }


    $scope.logout = function () {
        User.signOut();
        $location.path('/login');
    }

    $scope.sizeLimit = 10585760; // 10MB in Bytes
    $scope.uploadProgress = 0;
    $scope.creds = {};

    $scope.upload = function () {
        AWS.config.update({accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key});
        AWS.config.region = 'us-east-1';
        var bucket = new AWS.S3({params: {Bucket: $scope.creds.bucket}});

        if ($scope.file) {
            // Perform File Size Check First
            var fileSize = Math.round(parseInt($scope.file.size));
            if (fileSize > $scope.sizeLimit) {
                toastr.error('Sorry, your attachment is too big. <br/> Maximum ' + $scope.fileSizeLabel() + ' file attachment allowed', 'File Too Large');
                return false;
            }
            // Prepend Unique String To Prevent Overwrites
            var uniqueFileName = $scope.uniqueString() + '-' + $scope.file.name;

            var params = {
                Key: uniqueFileName,
                ContentType: $scope.file.type,
                Body: $scope.file,
                ServerSideEncryption: 'AES256'
            };

            bucket.putObject(params, function (err, data) {
                if (err) {
                    toastr.error(err.message, err.code);
                    return false;
                }
                else {
                    // Upload Successfully Finished
                    toastr.success('File Uploaded Successfully', 'Done');

                    // Reset The Progress Bar
                    setTimeout(function () {
                        $scope.uploadProgress = 0;
                        $scope.$digest();
                    }, 4000);
                }
            })
                .on('httpUploadProgress', function (progress) {
                    $scope.uploadProgress = Math.round(progress.loaded / progress.total * 100);
                    $scope.$digest();
                });
        }
        else {
            // No File Selected
            toastr.error('Please select a file to upload');
        }
    }

    $scope.fileSizeLabel = function () {
        // Convert Bytes To MB
        return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
    };

    $scope.uniqueString = function () {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 8; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

}]);

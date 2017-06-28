'use strict';

var controllers = angular.module('app.controllers', []);


controllers.controller('loginController', ['$scope', 'config', '$location', 'User', function ($scope, config, $location, User) {


    $scope.options = {
        'onsuccess': function (googleUser) {
            var GoogleProfile = googleUser.getBasicProfile();
            var GoogleUser = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse(true);
            // console.log('-----');
            // console.info('Google Profile');
            // console.log(GoogleProfile);
            // console.log('-----');
            // console.info('Google User');
            // console.log(GoogleUser);
            $scope.logged = false;
            User.getCredentials(GoogleUser).get(function (err) {
                if (err) {
                    $scope.color = 'red';
                    $scope.message = err;
                } else {
                    $scope.color = 'green';
                    $scope.message = 'Logged as ' + GoogleProfile.U3;
                    $scope.avatar = GoogleProfile.Paa;
                    $scope.logged = true;
                    console.log('---AWS credentials --');
                    console.log(AWS.config.credentials);

                    var obj = {};
                    obj.email = GoogleProfile.U3;
                    obj.id_token = GoogleUser.id_token;
                    obj.avatar = GoogleProfile.Paa;
                    obj.sessionToken = AWS.config.credentials.sessionToken;
                    obj.accessKeyId = AWS.config.credentials.accessKeyId;
                    User.set(obj);
                    $location.path('/');
                }
                $scope.$apply();
            });


        },
        'onfailure': function (error) {
            console.log(error);
            $scope.color = 'red';
            $scope.message = error;
            $scope.$apply();
        }
    }


}]);





controllers.controller('mainController', ['$scope', '$location', 'User', 'config', function ($scope, $location, User, config) {

    $scope.user = User.get();
    $scope.color = 'blue';
    $scope.message = 'Loading...';
    $scope.Contents =[];


    AWS.config.credentials = User.getCredentials($scope.user);
    var bucket = new AWS.S3( {params: {
        Bucket: config.BucketName,
        Tag: [{Key: 'Partner', Value: 'Lev' }],
        //Prefix: 'JUNE'
    }});


    var params = {
        Bucket: config.BucketName,
        Key: "HappyFace.jpg"
    };
    // bucket.getBucketLifecycleConfiguration(params, function(err, data) {
    //     console.log('[getBucketLifecycleConfiguration]');
    //     console.log(err);
    //     console.log(data);
    //
    // });



    bucket.listObjects(function (err, data) {
        console.log('[listObjects]');
        console.log(err);
        console.log(data);

        if (err) {
            $scope.color = 'red';
            $scope.message = err.message || (err.originalError && err.originalError.originalError && err.originalError.originalError.message) || 'Exception. Try to relogin.';

        } else {
            $scope.Contents = data.Contents;
            $scope.color = 'green';
            $scope.message = '' + config.BucketName;
        }
        $scope.$apply();
    });


    $scope.logout = function () {

        User.signOut();
       // $location.path('/login');
        window.location = '/#/login'
    };

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


controllers.controller('loginControllerWas', ['$scope', 'config', '$location', 'User', function ($scope, config, $location, User) {
    $scope.user_id = 'Lev.Savranskiy@gmail.com';
    $scope.password = '123456';
    $scope.loading = false;
    var cognitoUser = User.getSessionUser();
    var authenticationDetails;

    console.log('cognitoUser');
    console.log(cognitoUser);

    if (cognitoUser && cognitoUser.error) {
        $scope.color = 'red';
        $scope.message = cognitoUser.error.message;
    } else {

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


            var UserObj = User.signIn(authenticationData);

            UserObj.cognitoUser.authenticateUser(UserObj.authenticationDetails, {
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

                    userAttributes.email = $scope.user_id;

                    console.log(userAttributes);

                    // Get these details and call
                    UserObj.cognitoUser.completeNewPasswordChallenge($scope.password, userAttributes, this);
                }

            });

        }
    }


}]);
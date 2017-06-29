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

    $scope.Contents = [];
    $scope.s3url = 'https://console.aws.amazon.com/s3/buckets/' + config.BucketName + '/';


    AWS.config.credentials = User.getCredentials($scope.user);


    $scope.logout = function () {

        User.signOut();
        // $location.path('/login');
        window.location = '/#/login'
    };

    $scope.sizeLimit = 100000000; // 10MB in Bytes
    $scope.uploadProgress = 0;
    $scope.creds = {};
    var bucket = new AWS.S3({
        params: {
            Bucket: config.BucketName,
            //Tag: [{Key: 'Partner', Value: 'Lev'}]
            //Prefix: 'JUNE'
        }
    });
    $scope.getData = function () {

        $scope.color = 'blue';
        $scope.message = 'Loading...';
        $scope.loading = true;
        $scope.error = false;


        $scope.tags = {};

        bucket.listObjects(function (err, data) {
            console.log('[listObjects]');
            console.log(err);
            console.log(data);

            if (err) {
                $scope.color = 'red';
                $scope.message = err.message || (err.originalError && err.originalError.originalError && err.originalError.originalError.message);
                $scope.message += ' error. Try to relogin.'

            } else {
                $scope.Contents = data.Contents;
                angular.forEach(data.Contents, function (item, key) {

                    var params = {
                        Bucket: config.BucketName,
                        Key: item.Key
                    };

                    var arr = item.Key.split('/');
                    //console.log(arr);

                    item.Filename = arr[arr.length - 1].length ? arr[arr.length - 1] : arr.join(' / ');
                    item.Filename = item.Key;
                    item.pathlength = arr.length;

                    if(item.Size>0){
                        bucket.getObjectTagging(params, function (err, data) {
                            //console.log('---');
                            //console.log('[getObjectTagging ]' + item.Key);
                            if (!err) {

                                $scope.tags[item.Key] = data.TagSet;
                                $scope.$apply();
                                angular.forEach(data.TagSet, function (item, key) {
                                    console.log(item);
                                })
                            } else {
                                console.error(err);
                            }
                        });
                    }else{
                        //delete data.Contents[key];
                    }

                });

                $scope.color = 'green';
                $scope.message = '' + config.BucketName;
            }
            $scope.loading = false;
            $scope.$apply();

        });
    };

    $scope.getData();

    $scope.edit = function () {
        alert('todo');
    }

    $scope.download = function (item) {
        var params = {
            Bucket: config.BucketName,
            Key: item.Key,
            Expires: 60
        };


        bucket.getSignedUrl('getObject', params, function (err, url) {
            console.log('getSignedUrl', url);
            window.open(url, "_blank");
        });

    }
    $scope.unlink = function (item) {
        var r = confirm("Are you sure you want to delete this file?");
        if (r === true) {
            var params = {
                Bucket: config.BucketName,
                Key: item.Key
            };
            bucket.deleteObject(params, function(err, data) {
                if (err){
                    toastr.error(err, 'Error');
                }else{
                    toastr.success('File was deleted', 'Done');
                    $scope.getData();
                }
            });
        }
    }

    $scope.upload = function () {


        if ($scope.file) {
            // Perform File Size Check First
            var fileSize = Math.round(parseInt($scope.file.size));
            if (fileSize > $scope.sizeLimit) {
                toastr.error('Sorry, your attachment is too big. <br/> Maximum ' + $scope.fileSizeLabel() + ' file attachment allowed', 'File Too Large');
                return false;
            }
            // Prepend Unique String To Prevent Overwrites
            var FileName = $scope.prefix() + $scope.file.name;



            var params = {
                Key: FileName,
                ContentType: $scope.file.type,
                Body: $scope.file,
                ServerSideEncryption: 'AES256'
            };

            console.log(FileName);
            //return;

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
                    $scope.getData();
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

    $scope.prefix = function () {
        var date = new Date();
        var d = date.getDate();
        var m = date.getMonth() + 1;
        var y = date.getFullYear();
        var text =   y + "/" + m + "/" + d + "/";
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
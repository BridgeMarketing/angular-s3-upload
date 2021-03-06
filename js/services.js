angular.module('app.services', [])


    .factory('User', ['$q', '$http', '$window', '$location', 'config',
        function ($q, $http, $window, $location, config) {

            var u = {

                signOut: function () {
                    //todo
                    localStorage.clear();
                    sessionStorage.clear();
                  // var obj = {
                    //     id_token: u.get().id_token
                    // }
                    // u.getCredentials(obj).clearCachedId();
                },

                set: function (obj) {
                    window.sessionStorage.email = obj.email;
                    window.sessionStorage.id_token = obj.id_token;
                    window.sessionStorage.avatar = obj.avatar;
                    window.sessionStorage.accessKeyId = obj.accessKeyId;
                    window.sessionStorage.sessionToken = obj.sessionToken;
                    console.info('----USER SET----');
                    console.log(obj);
                },

                get: function () {
                    var obj = {};
                    obj.email = window.sessionStorage.email;
                    obj.id_token = window.sessionStorage.id_token;
                    obj.avatar = window.sessionStorage.avatar;
                    obj.accessKeyId = window.sessionStorage.accessKeyId;
                    obj.sessionToken = window.sessionStorage.sessionToken;
                    console.info('----USER GET----');
                    console.log(obj);
                    return obj;
                },



                getCredentials: function (currentUser) {
                    // Initialize the Amazon Cognito credentials provider
                    AWS.config.region = config.PoolRegion; // Region
                    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                        IdentityPoolId: config.IdentityPoolId,
                        Logins: {
                            'accounts.google.com': currentUser.id_token
                        }
                    });
                    return AWS.config.credentials;
                },

                //not in use
                signIn: function (authenticationData) {
                    var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
                    var poolData = {
                        UserPoolId: config.UserPoolId,
                        ClientId: config.ClientId
                    };
                    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
                    var userData = {
                        Username: authenticationData.Username,
                        Pool: userPool
                    };
                    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

                    return {
                        cognitoUser: cognitoUser,
                        authenticationDetails: authenticationDetails
                    }

                },

                getSessionUser: function (user_id, partner) {
                    var poolData = {
                        UserPoolId: config.UserPoolId,
                        ClientId: config.ClientId
                    };

                    try {
                        var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
                    } catch (e) {
                        return {
                            error: e
                        };
                    }

                    return userPool.getCurrentUser();
                },


                store: function (data) {
                    $window.sessionStorage.role = data.role;
                    $window.sessionStorage.id = data.id;
                    $window.sessionStorage.partner = data.partner;
                    $window.sessionStorage.user_id = data.user || data.user_id;
                },

                destroy: function (data) {
                    delete $window.sessionStorage.role;
                    delete $window.sessionStorage.id;
                    delete $window.sessionStorage.partner;
                    delete $window.sessionStorage.user_id;
                }
            };

            return u;
        }])


    .factory('storage', function () {
        var savedData = {};

        function set(key, val) {
            savedData[key] = val;
        }

        function get(key) {
            return savedData[key];
        }

        return {
            set: set,
            get: get
        }

    });
//todo
//.provider('base64', function ($window, $http) {})





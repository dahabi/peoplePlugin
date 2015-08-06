'use strict';
(function (angular) {
    angular
        .module('peoplePluginContent')
        .controller('ContentPeopleCtrl', ['$scope', 'Location', '$modal', 'Buildfire', 'TAG_NAMES', 'STATUS_CODE', '$routeParams', 'RankOfLastItem',
            function ($scope, Location, $modal, Buildfire, TAG_NAMES, STATUS_CODE, $routeParams, RankOfLastItem) {

                var _rankOfLastItem = RankOfLastItem.getRank();
                var ContentPeople = this;
                ContentPeople.isUpdating = false;
                ContentPeople.unchangedData = true;
                ContentPeople.linksSortableOptions = {
                    handle: '> .cursor-grab'
                };
                var _data = {
                    topImage: '',
                    iconImage: '',
                    fName: '',
                    lName: '',
                    position: '',
                    deepLinkUrl: '',
                    dateCreated: "",
                    socialLinks: [],
                    bodyContent: '',
                    rank: _rankOfLastItem
                };

                ContentPeople.item = {
                    data: angular.copy(_data)
                };
                updateMasterItem(ContentPeople.item);
                function updateMasterItem(item) {
                    ContentPeople.masterItem = angular.copy(item);
                }

                function resetItem() {
                    ContentPeople.item = angular.copy(ContentPeople.masterItem);
                }

                function isUnchanged(item) {
                    return angular.equals(item, ContentPeople.masterItem);
                }

                /*On click button done it redirects to home*/
                ContentPeople.done = function () {
                    Location.goToHome();
                };

                /*On click button delete it removes current item from datastore*/
                ContentPeople.deleteItem = function () {
                    var item = ContentPeople.item;
                    if (item.id) {
                        Buildfire.datastore.delete(item.id, TAG_NAMES.PEOPLE, function (err, result) {
                            if (err)
                                return;
                            Location.goToHome();
                        });
                    }
                };
                ContentPeople.getItem = function (itemId) {
                    Buildfire.datastore.getById(itemId, TAG_NAMES.PEOPLE, function (err, item) {
                        if (err)
                            console.error('There was a problem saving your data');
                        ContentPeople.item = item;
                        _data.dateCreated = item.data.dateCreated;
                        _data.rank = item.data.rank;
                        updateMasterItem(ContentPeople.item);
                        $scope.$digest();
                    });
                };
                if ($routeParams.itemId) {
                    ContentPeople.getItem($routeParams.itemId);
                }
                ContentPeople.addNewItem = function () {
                    _rankOfLastItem = _rankOfLastItem + 10;
                    ContentPeople.item.data.dateCreated = +new Date();
                    ContentPeople.item.data.rank = _rankOfLastItem;

                    Buildfire.datastore.insert(ContentPeople.item.data, TAG_NAMES.PEOPLE, false, function (err, data) {
                        ContentPeople.isUpdating = false;
                        if (err)
                            return console.error('There was a problem saving your data');
                        RankOfLastItem.setRank(_rankOfLastItem);
                        ContentPeople.getItem(data.id);
                    });
                };
                ContentPeople.updateItemData = function () {
                    Buildfire.datastore.update(ContentPeople.item.id, ContentPeople.item.data, TAG_NAMES.PEOPLE, function (err) {
                        ContentPeople.isUpdating = false;
                        if (err)
                            console.error('There was a problem saving your data');
                    })
                };

                ContentPeople.openEditLink = function (link,index) {
                  var options = {showIcons: false};
                  var callback = function (error, result) {
                    if (error) {
                      console.error('Error:', error);
                    } else {
                      console.log(")))))))))))))))", result);
                      ContentPeople.item.data.socialLinks.splice(index, 1, result);
                      $scope.$digest();
                    }
                  };
                  Buildfire.actionItems.showDialog (link , options , callback);
                };

                Buildfire.datastore.onUpdate(function (event) {
                    if (event && event.status) {
                        switch (event.status) {
                            case STATUS_CODE.INSERTED:
                                console.log('Data inserted Successfully');
                                Buildfire.datastore.get(TAG_NAMES.PEOPLE_INFO, function (err, result) {
                                    if (err) {
                                        console.error('There was a problem saving your data');
                                    } else {
                                        result.data.content.rankOfLastItem = _rankOfLastItem;
                                        Buildfire.datastore.save(result.data, TAG_NAMES.PEOPLE_INFO, function (err) {
                                            if (err)
                                                console.error('There was a problem saving last item rank');
                                        });
                                    }
                                });
                                break;
                            case STATUS_CODE.UPDATED:
                                console.log('Data updated Successfully');
                                break;
                        }
                    }
                });

                ContentPeople.openAddLinkPopup = function () {
                  var options = {showIcons: false};
                  var callback = function (error, result) {
                    if (error) {
                      console.error('Error:', error);
                    } else {
                      if (!ContentPeople.item.data.socialLinks)
                        ContentPeople.item.data.socialLinks = [];
                      ContentPeople.item.data.socialLinks.push(result);
                      $scope.$digest();
                    }
                  };
                  Buildfire.actionItems.showDialog (null , options , callback);
                };

                ContentPeople.removeLink = function (_index) {
                    ContentPeople.item.data.socialLinks.splice(_index, 1);
                };

                var options = {showIcons: false, multiSelection: false};
                var callback = function (error, result) {
                    if (error) {
                        console.error('Error:', error);
                    } else {
                      if(result.selectedFiles && result.selectedFiles.length){
                        var newUrl = Buildfire.imageLib.cropImage(result.selectedFiles[0],{width: 600,height : 600});
                        ContentPeople.item.data.topImage = newUrl && newUrl || null;
                        $scope.$digest();
                      }
                    }
                };

                ContentPeople.selectTopImage = function () {
                    Buildfire.imageLib.showDialog(options, callback);
                };

                ContentPeople.removeTopImage = function () {
                    ContentPeople.item.data.topImage = null;
                };


                var tmrDelayForPeoples = null;
                var updateItemsWithDelay = function (item) {
                    if (tmrDelayForPeoples) {
                        clearTimeout(tmrDelayForPeoples);
                        ContentPeople.isUpdating = false;
                    }
                    ContentPeople.unchangedData = angular.equals(_data, ContentPeople.item.data);
                    if (!ContentPeople.isUpdating && !isUnchanged(ContentPeople.item)) {
                        tmrDelayForPeoples = setTimeout(function () {
                            if (item.id) {
                                ContentPeople.updateItemData();
                            }
                            else {
                                ContentPeople.addNewItem();
                            }
                        }, 1000);
                    }
                };

                $scope.$watch(function () {
                    return ContentPeople.item;
                }, updateItemsWithDelay, true);
            }]);
})(window.angular);
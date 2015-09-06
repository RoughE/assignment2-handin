var fs = require('fs');
var _ = require('lodash');
var uris = require("./dropboxuris");
var base64util = require("./base64utils");

var localFs = {
    list:function(path,cb){
        path = uris.getPath(path);
        cb(fs.readdirSync(path));
    },
    stat:function(path,cb){
        path = uris.getPath(path);
        cb(fs.statSync(path));
    },
    writeFile: function(path,base64data,cb){
        path = uris.getPath(path);
        base64util.writeFromBase64Encoded(base64data, path);
        cb();
    },
    readFile: function(path,cb){
        path = uris.getPath(path);
        cb(base64util.readBase64Encoded(path));
    },
    deleteFile: function(path,cb){
        path = uris.getPath(path);
        fs.unlinkSync(path);
        cb();
    }
}

var fsHandlers = {
    file:localFs
};

function getHandler(path){
    var proto = uris.getProtocol(path);
    return fsHandlers[proto];
}

function filesMatchNameAndSize(fstate1,fstate2){

    var filesMatch = filesMatchName(fstate1,fstate2) && (fstate1.size == fstate2.size);

    return filesMatch;
}

function filesMatchName(fstate1,fstate2){

    var filesMatch = (fstate2);

    return filesMatch;
}

function captureDirectoryState(directoryInfo,cb){
    var directoryState = {};

    var fileList = directoryInfo.fileList;
    var path = directoryInfo.path;

    if(fileList.length == 0){
        cb(directoryState);
    }
    else {
        var handler = getHandler(path);

        var stateCaptureCallback =function (fileName,counter){
            return function (data) {
                directoryState[fileName] = data;
                counter();
            }
        };

        var callbacks = 0;
        var counter = function(){
            callbacks++;

            if (callbacks >= fileList.length) {
                cb(directoryState);
            }
        }

        for (var i = 0; i < fileList.length; i++) {
            var fileName = fileList[i];
            var collector = stateCaptureCallback(fileName, counter);
            handler.stat(path + "/" + fileName, collector);
        }
    }
}

function compareDirectoriesOneWay(state1,state2,matcher){
    var directoriesMatch = true;

    var needsCopyingToOtherDirectory = [];

    for(var name in state1){
        var fstate1 = state1[name];
        var fstate2 = state2[name];

        if(!matcher(fstate1,fstate2)) {

            var lastModified1 = (fstate1.ctime.getTime)? fstate1.ctime.getTime() : new Date(fstate1.ctime);
            var lastModified2 = (fstate2)?
                                    ((fstate2.ctime.getTime)?
                                            fstate2.ctime.getTime()
                                            : new Date(fstate2.ctime))
                                    : -1;

            if(lastModified1 > lastModified2){
                needsCopyingToOtherDirectory.push(name);
            }
        }
    }
    return needsCopyingToOtherDirectory;
}

function compare(path1,path2,matcher,cb){
    getDirectoryInfo(path1,function(directoryState1){
        getDirectoryInfo(path2,function(directoryState2){
            compareDirectories(directoryState1,directoryState2,matcher,cb);
        });
    });
}

function compareDirectories(directoryInfo1, directoryInfo2, matcher, cb){

    var fileList1 = directoryInfo1.fileList;
    var fileList2 = directoryInfo2.fileList;

    var path1 = directoryInfo1.path;
    var path2 = directoryInfo2.path;

    if(!fileList1 || !fileList2) {
        throw "An invalid directory info object was passed to the compare " +
        "directories method that had a null or " +
        "undefined file list.";
    }

    if(!path1 || !path2){
        throw "An invalid directory info object was passed to the compareDirectories" +
        "method that did not provide a path";
    }


    captureDirectoryState(directoryInfo1,function(state1){
        captureDirectoryState(directoryInfo2,function(state2){
            var syncTo2 =
                compareDirectoriesOneWay(state1,state2,matcher);

            var syncTo1 =
                compareDirectoriesOneWay(state2,state1,matcher);

            cb({
                syncToSrc:syncTo1,
                syncToTrg:syncTo2,
                directoriesMatch:function(){
                    return syncTo1.length === 0 && syncTo2.length === 0;
                }
            });
        });
    });
}

function getDirectoryInfo(path, cb){
    var handler = getHandler(path);

    handler.list(path, function(files){
        cb({
            fileList:files,
            path:path
        });
    });
}

function getFilesToBeOverwritten(path,filesToWrite) {
    getDirectoryInfo(path,function(directoryInfo){
        var fileList = directoryInfo.fileList;
        return _.intersection(filesToWrite, fileList);
    })
}

function getPreviousVersions(path,file) {
    getDirectoryInfo(path,function(directoryInfo){
        var fileList = directoryInfo.fileList;
        var matchingFiles = [];
        var regexStr = "\\(ver[0-9]+\\)" + _.escapeRegExp(file);
        var regex = new RegExp(regexStr);
        _.each(fileList, function(testFile){
            if (regex.test(testFile)) {
                matchingFiles.push(testFile);
            }
        })
        return matchingFiles;
    })
}

module.exports = {
    compare:compare,
    filesMatchName:filesMatchName,
    filesMatchNameAndSize:filesMatchNameAndSize,
    fsHandlers:fsHandlers,
    getHandler:getHandler,
    getFilesToBeOverwritten:getFilesToBeOverwritten,
    getPreviousVersions:getPreviousVersions
}

var fs = require('fs');
var _ = require('lodash');
var sync = require('./lib/sync/sync');

var versionDir = ".prev_versions";

function getPreviousVersions(path,filesToCheck) {
    sync.getDirectoryInfo(path,function(directoryInfo){
        var fileList = directoryInfo.fileList;
        var matchingFiles = {};
        _.each(filesToCheck,function(file) {
            matchingFiles[file] = [];
            var regexStr = "\\(ver[0-9]+\\)" + _.escapeRegExp(file);
            var regex = new RegExp(regexStr);
            _.each(fileList, function (testFile) {
                if (regex.test(testFile)) {
                    matchingFiles[file].push(testFile);
                }
            });
        });
        return matchingFiles;
    })
}

function writeNewVersion(fromPath,toPath){
    var handler = sync.getHandler(fromPath);
    handler.readFile(fromPath,function(base64Data){
        handler.writeFile(toPath,base64Data,function(){
            console.log("Saved " + fromPath + " as previous file version " + toPath);
        })
    });
}

function overwrite(fromPath,toPath){
    var handler = sync.getHandler(fromPath);
    handler.readFile(fromPath,function(base64Data){
        handler.writeFile(toPath,base64Data,function(){
            console.log("Previous file version " + toPath + " overwritten by " + fromPath);
        })
    });
}

function overwritePreviousVersions (dirPath,versions,newFile){
    var versionDirPath = dirPath + "/" + versionDir;

    for (var i = 1; i < versions.length; i++) {
        var fromPath = versionDirPath + "/" + versions[i];
        var toPath = versionDirPath + "/" + versions[i-1];
        overwrite(fromPath,toPath);
    }

    fromPath = dirPath + "/" + newFile;
    toPath = versionDirPath + "/" + versions[version.length-1];
    overwrite(fromPath, toPath);
}

function savePreviousVersions(dirPath,files,maxVersions) {
    var versionDirPath = dirPath + "/" + versionDir;
    var allVersions = getPreviousVersions(versionDirPath,files);
    _.each(files,function(file){
        var versions = allVersions[file];
        if (versions.length < maxVersions) {
            var fromPath = dirPath + "/" + file;
            var toPath = versionDirPath + "/(ver" + (versions.length+1) + ")" + file;
            writeNewVersion(fromPath,toPath);
        } else {
            overwritePreviousVersions(dirPath,versions,file);
        }
    });
}


module.exports = {
    savePreviousVersions:savePreviousVersions
}

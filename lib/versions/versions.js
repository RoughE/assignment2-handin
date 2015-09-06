var fs = require('fs');
var _ = require('lodash');
var sync = require('./lib/sync/sync');

var versionDir = ".prev_versions";

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

function overwritePreviousVersions (dirPath,prevDirPath,versions,newFile){
    for (var i = 1; i < versions.length; i++) {
        var fromPath = prevDirPath + "/" + versions[i];
        var toPath = prevDirPath + "/" + versions[i-1];
        overwrite(fromPath,toPath);
    }

    fromPath = dirPath + "/" + newFile;
    toPath = prevDirPath + "/" + versions[version.length-1];
    overwrite(fromPath, toPath);
}

function savePreviousVersion(dirPath,file,maxVersions) {
    var prevDirPath = dirPath + "/" + versionDir;
    var versions = getPreviousVersions(prevDirPath,file);
    if (versions.length < maxVersions) {
        var fromPath = dirPath + "/" + file;
        var toPath = prevDirPath + "/(ver" + (versions.length+1) + ")" + file;
        writeNewVersion(fromPath,toPath);
    } else {
        overwritePreviousVersions(dirPath,prevDirPath,versions,file);
    }
}


module.exports = {
    getPreviousVersions:getPreviousVersions,
    savePreviousVersion:savePreviousVersion
}


function getProtocol(path){
    var proto = "file";

    var indexOfProto = path.indexOf("://");
    if(indexOfProto > -1) {
        proto = path.substring(0,indexOfProto);
    }

    return proto;
}

function getPath(protocolAndPath){
    if(protocolAndPath.indexOf("://") >= 0){
        protocolAndPath = protocolAndPath.substring(getProtocol(protocolAndPath).length + "://".length);
    }
    return protocolAndPath;
}

module.exports = {
    getProtocol:getProtocol,
    getPath:getPath
}
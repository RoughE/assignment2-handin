
var _ = require('lodash')

function Pipeline(){
    this.currentIndex = 0;
    this.actions = [];
}

Pipeline.prototype.addAction = function(action){

    if(!action.exec){
        throw "Actions must have an exec() function";
    }

    this.actions.push(action);
}

Pipeline.prototype.exec = function(data) {
    var history = [data];
    _.each(this.actions, function(action){
        data = action.exec(data);
        history.push(data);
    });

    return {
        history:history,
        result:history[history.length - 1]
    };
}

module.exports = {
    Pipeline:Pipeline
}
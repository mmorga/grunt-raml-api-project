'use strict';

var grunt = require('grunt');

module.exports.allSchemaFiles = function () {
    return grunt.file.expand(['schema/*.json']).map(function (sf) {
        return grunt.file.readJSON(sf);
    });
};

module.exports.allSchemaFilesIdMap = function () {
    return grunt.file.expand(['schema/*.json']).reduce(function (pv, sf) {
        var json = grunt.file.readJSON(sf);
        pv[sf.id] = json;
        return pv;
    }, {});
};

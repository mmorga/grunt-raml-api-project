#!/usr/bin/env node

'use strict';

var fs = require('fs');
var yaml = require('js-yaml');
var jsonpath = require('jsonpath');
var path = require('path');
var async = require('async');
var q;
var results = [], mainCallback;

function taskDone(err) {
    if (err) {
        console.log(err);
    }
}

function Include(p) {
    this.klass = 'Include';
    this.bangIncludePath = p;
}

var IncludeYamlType = new yaml.Type('!include', {
    // Loader must parse sequence nodes only for this type (i.e. arrays in JS terminology).
    // Other available kinds are 'scalar' (string) and 'mapping' (object).
    // http://www.yaml.org/spec/1.2/spec.html#kind//
    kind: 'scalar',

    // If a node is resolved, use it to create a Point instance.
    construct: function (data) {
        return new Include(data);
    },

    // Dumper must process instances of Point by rules of this YAML type.
    instanceOf: Include,

    // Dumper must represent Point objects as three-element sequence in YAML.
    represent: function (inc) {
        return inc.bangIncludePath;
    }
});

var RAML_SCHEMA = yaml.Schema.create([ IncludeYamlType ]);

function processSchema(schemaEntry) {
    return schemaEntry[Object.getOwnPropertyNames(schemaEntry)[0]].bangIncludePath;
}

function processRaml(raml, parent) {
    var task,
        schemaFiles = jsonpath.query(raml, '$.schemas..bangIncludePath');

    jsonpath.query(raml, '$..bangIncludePath').forEach(function (p) {
        switch (path.extname(p)) {
        case '.raml':
        case '.yaml':
        case '.yml':
            task = path.dirname(parent) + '/' + p;
            q.push(task);
            break;
        }
    });
    return schemaFiles;
}

function worker(task, callback) {
    fs.readFile(task, function (err, raml) {
        if (err) {
            console.log(err);
            return callback(err);
        }
        results = results.concat(processRaml(yaml.load(raml, {schema: RAML_SCHEMA}), task));
        return callback(null);
    });
}

function drain() {
    mainCallback(results);
}

function schemaFilesInRamlFile(ramlFile, callback) {
    results = [];
    mainCallback = callback;
    q = async.queue(worker, 10);
    q.drain = drain;
    q.push(ramlFile);
}

module.exports.schemaFilesInRamlFile = schemaFilesInRamlFile;

if (require.main === module) {
    schemaFilesInRamlFile('skumapper.raml', function (r) { console.log(r); });
    // schemaFilesInRamlFile('../provisioning-service/docs/api_contract/provisioning-ui-api.raml', function (r) { console.log(r); });
    // schemaFilesInRamlFile('../../public-ticket-api/api/public-ticket.raml');
}

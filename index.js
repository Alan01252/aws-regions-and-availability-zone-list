"use strict";

var AWS = require('aws-sdk');


var config = {};

if (!process.env.AWS_EXECUTION_ENV) {
    config = {
        accessKeyId: process.env.aws_access_key,
        secretAccessKey: process.env.secret_access_key,
        region: process.env.aws_region
    }
}

exports.handler = function (event, context) {

    var ec2 = new AWS.EC2(config);
    ec2.describeRegions({}, function (err, data) {
        if (!err) {
            data.Regions.map(function (region) {
                var ec2 = new AWS.EC2(Object.assign(config, {
                    region: region.RegionName
                }));
                ec2.describeAvailabilityZones({}, function (err, zones) {
                    var zones = zones.AvailabilityZones.map(function (a) {
                            return a.ZoneName
                        }
                    ).join(",");
                    console.log(region.RegionName + "   " + zones);

                })
            })
        } else {
            console.log(err);
        }
    });
};
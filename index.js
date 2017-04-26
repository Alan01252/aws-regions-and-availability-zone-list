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

var GitHubApi = require("github");

var github = new GitHubApi({});
github.authenticate({
    type: "token",
    token: process.env.github_token
});


exports.handler = function (event, context) {

    var ec2 = new AWS.EC2(config);
    ec2.describeRegions({}, function (err, data) {
        if (!err) {

            let output = [];

            let getOutput = (callback) => {
                const regionLength = data.Regions.length;
                data.Regions.map(function (region, index) {


                    var ec2 = new AWS.EC2(Object.assign(config, {
                        region: region.RegionName
                    }));

                    ec2.describeAvailabilityZones({}, (err, zones) => {

                        var zones = zones.AvailabilityZones.map((a) => {
                                return a.ZoneName
                            }
                        ).join(" , ");

                        output.push("- " + region.RegionName + " | " + zones)

                        if (regionLength === index + 1) {
                            callback();
                        }
                    });


                });
            };

            getOutput(() => {
                console.log("here2");
                github.repos.getReadme({
                    owner: 'alan01252',
                    repo: 'aws-regions-and-availability-zone-list',
                }).then(function (readme) {

                    console.log(output);
                    github.repos.updateFile({
                        owner: 'alan01252',
                        repo: 'aws-regions-and-availability-zone-list',
                        path: 'README.md',
                        sha: readme.data.sha,
                        message: 'Updating regions and availability zones',
                        content: new Buffer(output.join("\r\n")).toString('base64')
                    }).then(function (result) {
                        console.log(result);
                    }).catch(function (err) {
                        console.log(err)
                    });
                })
            });

        } else {
            console.log(err);
        }
    });
};
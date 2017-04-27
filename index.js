"use strict";

var AWS = require('aws-sdk'),
    GitHubApi = require("github"),
    github = new GitHubApi({});

github.authenticate({
    type: "token",
    token: process.env.github_token
});

let config = {};
if (!process.env.AWS_EXECUTION_ENV) {
    config = {
        accessKeyId: process.env.aws_access_key,
        secretAccessKey: process.env.secret_access_key,
        region: process.env.aws_region
    };
}


exports.handler = function (event, context) {

    var ec2 = new AWS.EC2(config);
    ec2.describeRegions({}, function (err, data) {
        if (!err) {

            let output = {};


            let getOutput = (callback) => {
                const regionLength = data.Regions.length;
                let found = regionLength;
                data.Regions.map(function (region, index) {

                    var ec2 = new AWS.EC2(Object.assign(config, {
                        region: region.RegionName
                    }));

                    ec2.describeAvailabilityZones({}, (err, zones) => {

                        const foundZones = zones.AvailabilityZones.map((a) => {
                                return a.ZoneName
                            }
                        ).join(" , ");

                        output[region.RegionName] = foundZones;

                        found--;
                        if (found === 0) {
                            callback();
                        }
                    });

                });
            };

            getOutput(() => {

                var readmeText = [];
                readmeText.push('# AWS Regions and Availability Zones List');


                Object.keys(output)
                    .sort()
                    .forEach(function (region) {
                        readmeText.push("- " + region + " | " + output[region]);
                    });


                github.repos.getReadme({
                    owner: 'alan01252',
                    repo: 'aws-regions-and-availability-zone-list',
                }).then(function (readme) {

                    if (readmeText.join("\r\n") !== new Buffer(readme.data.content, 'base64').toString("ascii")) {

                        github.repos.updateFile({
                            owner: 'alan01252',
                            repo: 'aws-regions-and-availability-zone-list',
                            path: 'README.md',
                            sha: readme.data.sha,
                            message: 'Updating regions and availability zones',
                            content: new Buffer(readmeText.join("\r\n")).toString('base64')
                        }).then(function (result) {
                            console.log(result);
                        }).catch(function (err) {
                            console.log(err)
                        });

                    }
                })
            });

        } else {
            console.log(err);
        }
    });
};
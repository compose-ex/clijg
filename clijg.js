#!/usr/bin/env node

const fetch = require('node-fetch');
const btoa = require('btoa');
const yargs = require('yargs');

var argv = yargs.command("deletegraph <serverurl> <graphname> <username> <password>", "Delete a graph", (yargs) => {
    yargs.positional('serverurl', {
        describe: 'URL for JanusGraph server',
        type: 'string'
    }).positional('graphname', {
        describe: 'Graph to be deleted',
        type: 'string'
    }).positional('username', {
        describe: 'Username to delete with',
        type: 'string'
    }).positional('password', {
        describe: 'Password for user',
        type: 'string'
    });
}, (argv) => {
    deletegraph(argv.serverurl, argv.graphname, argv.username, argv.password).then(res => {
        console.log("Done")
    })
}).help().argv

async function deletegraph(serverurl, graphname, username, password) {
    // First get a token
    const res = await fetch(serverurl + "/session", {
        headers: {
            'Authorization': 'Basic ' + btoa(username + ":" + password),
        }
    });
    const json = await res.json();
    token = json.token;
    // We now have a token

    command = `
    import org.janusgraph.graphdb.database.StandardJanusGraph; 
    import org.janusgraph.core.util.JanusGraphCleanup; 
    def graph = ConfiguredGraphFactory.open("${graphname}"); 
    ConfiguredGraphFactory.close("${graphname}"); 
    graph.close(); 
    ConfigurationManagementGraph.getInstance().removeConfiguration("${graphname}"); 
    JanusGraphCleanup.clear(graph);
    `;
    body = {
        "gremlin": command
    };
    const cmdres = await fetch(serverurl, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        }
    });
    const cmdjson = await cmdres.json();


    commanddel = `ConfiguredGraphFactory.close("${graphname}")`;

    for (n = 1; n < 10; n++) {
        body = {
            "gremlin": commanddel
        };
        const cmdres = await fetch(serverurl, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            }
        });
        cmddeljson = await cmdres.json();
    }
}

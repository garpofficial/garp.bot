
const Discord = require('discord.js');
const client = new Discord.Client();
config = require('./config/default.json');
const rp = require('request-promise');

var logger = require("./logger");
logger.info("Logging initiated");

// Instatiate database
const Database=require('./database');
global.pool=new Database();


client.once('ready', () => {

    logger.info('# Reboot ******************************************* Ready!');
    client.user.setActivity(config.bot.prefix+' help', { type: 'PLAYING' });
    dailyMessage();
});

client.on("message", async message => {
    // surpress any echo
    if (message.author.bot)
        return;
    // just listen to targeted commands
    if (!message.content.startsWith(config.bot.prefix)) {
        return;
    }

    // Ok this is for us
    logger.info('#app: Print channel id: %s, Guildid %s', message.channel , message.guild.id);

    let guildid = message.guild.id;
    var sql = "SELECT * FROM guild WHERE guildid = " + pool.escape(guildid);
    pool.query(sql, function (error, rows, fields) {
        if (error) {
            logger.error('#app Error: %s', error);
        } else {
            if (rows.length != 1) {
//                logger.info("#app: Guild not configured for server %s:", message.guild.name);
                if (!message.content.startsWith(config.bot.prefix)) {
                    return;
                }
                const args = message.content
                    .slice(config.bot.prefix.length)
                    .trim()
                    .split(/ +/g);
                const command = args.shift().toLowerCase();
                logger.info("#app: Message: %s", message.content);
                logger.info("Command %s, args %s", command, args);

                switch (command) {
                    case 'config':
                        if (args.shift().toLowerCase() === "channelid") {
                            if (message.member.roles.cache.some(r => r.name === "ABM")) {
                                message.channel.send('Thanks for configuring me, master.');
                                let channelid = args.shift().toLowerCase();
                                let guildid = message.guild.id;
                                var sql = 'SELECT * FROM guild WHERE guildid=' + pool.escape(guildid);
                                logger.info("#app: SQL: %s", sql);
                                pool.query(sql, function (error, rows, fields) {
                                    if (error) {
                                        logger.error('#app Error: %s', error);
                                    } else {
                                        if (rows.length == 1) {
                                            var sql = 'UPDATE guild SET channelid=' + channelid + ' WHERE guildid=' + pool.escape(guildid);
                                        } else {
                                            var sql = 'INSERT INTO guild (guildid, channelid, regdate,status) VALUES (' + pool.escape(guildid) + ', ' + pool.escape(channelid) + ', \"' + pool.mysqlNow() + '\",0)';
                                        }
                                        logger.info("#app: SQL: %s", sql);
                                        pool.query(sql, function (error, rows, fields) {
                                            if (error) {
                                                logger.error('#app Error: %s', error);
                                            } else {
                                            }

                                        });
                                    }
                                });

                            } else {
                                message.channel.send('You need to have the role: ABM to do this');
                            }

                        }
                        break;
                    default:
                        message.channel.send('In order to make the bot work properly, You need to configure the channel id, where the bot can send announcements.' +
                            '\nYou do this with sending !garp config channelid 234234 or what ever Your channel id You want the bot to appear.' +
                            '\nAlso, You need to have the role \'GARP\' in order to set the above command.' +
                            '\n');

                        logger.info("#app: Not found: %s", command);
                        break;
                }
            } else {
                if (!message.content.startsWith(config.bot.prefix)) {
                    return;
                }
                logger.info("#apps Normal commands");
                const args = message.content
                    .slice(config.bot.prefix.length)
                    .trim()
                    .split(/ +/g);
                const command = args.shift().toLowerCase();
                logger.info("#app: Message: %s", message.content);
                logger.info("#app: Command %s, args %s", command, args);
                let tipper = message.author.id.replace('!', '');
                switch (command) {
                    case 'help':
                        doHelp(message);
                        break;
                    case "stats":
                        doStats(client, message);
                        break;

                    case 'games':
                        doGames(message);
                        break;
                    case 'config channelid':
                        logger.info("#app: Command %s", command.shift());
                        break;

                }
                // do some House keeping
                // log which channel and guild the message has been sent
                // which command has been triggered
                vsql = "UPDATE funcstats SET func_count=func_count+1 WHERE func_name='" + command + "'";
                logger.info("#app: SQL: %s", vsql);
                pool.query(vsql, function(error, rows, fields) {
                    if (error) {
                        logger.error( "#app: Error: %s", error);
                        throw error;
                    }

                    // Let's check if the msg.channel is already in the database
                    vsql = "SELECT channel_id FROM channel WHERE channel_id= '" + message.channel.id + "'";
                    pool.query(vsql, function(error, rows, fields) {
                        if (error) {
                            logger.error( "#app: Error: %s", error);
                            throw error;
                        }
                        if (rows.length == 0 && typeof message.channel.guild != "undefined") {
                            logger.info("#app: Introduce channel id: %s",message.channel.id, message.channel.guild);
                            vsql = "INSERT INTO channel (channel_id, channel_guild, channel_guildid, channel_count) VALUES ('" + message.channel.id + "', '" + message.channel.guild + "','" + message.channel.guild.id + "', '" + 0 + "')";
                            pool.query(vsql, function(error, rows, fields) {
                                if (error) {
                                    logger.error("#app: Error: %s", error);
                                    throw error;
                                }
                            });
                        }
                        // Ok now we are ready to update the count
                        vsql = "UPDATE channel SET channel_count=channel_count+1 WHERE channel_id='" + message.channel.id + "'";
                        pool.query(vsql, function(error, rows, fields) {
                            if (error) {
                                logger.error("#app: Error: %s", error);
                                throw error;
                            }
                        });
                    });
                });

            }
        }
    });
});


logger.info("#app: Registration: %s", config.bot.token);
client.login(config.bot.token);



function doHelp(message, helpmsg) {
    helpmsg =
        '__**GARP bot**__\n' +
        '      '+config.bot.prefix+' help: Displays This Message\n' +
        '      '+config.bot.prefix+' games:	Ongoing games\n' +
        '\n' +
        '**Admin section**\n' +
        'If You have the role GARP You can instruct the bot which channel to use for announcements.' +
        '\n' +
        '      '+config.bot.prefix+' config channelid <CHANNELID>\n' +
       '\n';

        message.channel.send(helpmsg);
}


function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function doStats(client, message) {
    var servers;

    let guilds = client.guilds.cache.map(guild => guild.name) // for discord v11 //let guilds = client.guilds.map(guild => guild.id)
    logger.info("#app.doStats: %s",guilds);
    servers = "Served servers: " + guilds.length + "\n" + guilds + "\n";

    message.channel.send({
        embed: {
            description: '**ATH stats**',
            color: 1363892,
            fields: [
                {
                    name: '__Served servers__',
                    value: servers,
                    inline: false
                }
            ]
        }
    });
}

function dailyMessage() {
    // Build message first
    var url = "https://portal.atheios.org/rest/games";

    rp({

        url: url,
        json: true
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            logger.info("Body %s", JSON.stringify(body)); // Print the json response
            logger.info("Nr games active %s", body.games.length);
            const exampleEmbed = {
                color: 0xffff,
                title: '**GARP powered games**',
                url: 'https://garp.io',
                author: {
                    name: 'GARP',
                    icon_url: 'https://garp.io/images/logo-default.png',
                    url: 'https://garp.io',
                },
                description: 'Active game list',
                thumbnail: {
                    url: 'https://garp.io/images/logo-default.png',
                },
                fields: [],
                timestamp: new Date(),
                footer: {
                    text: 'GARP bot',
                },
            };
            var gurl = "";
            for (var i = 0; i < body.games.length; i++) {
                if (body.games[i].url === "") {
                    gurl = "";
                } else {
                    gurl = ", [Link](" + body.games[i].url + ")";
                }
                exampleEmbed.fields[i] = {
                    name: body.games[i].name + gurl,
                    value: body.games[i].currentpayout + " ATH\n" + body.games[i].ethopayout + " ETHO\n",
                    inline: false
                }
            }

            var sql = "SELECT * FROM guild";
            logger.info("#dailyMessage: SQL: %s", sql);
            pool.query(sql, function (error, rows, fields) {
                if (error) {
                    logger.error('#app.dailyMessage Error: %s', error);
                    return false;
                } else {
                    logger.info("#app.dailyMessage Guild entries: %s", rows.length);
                    for (var i = 0; i < rows.length; i++) {
                        let guild = client.guilds.cache.get(rows[i].guildid);
                        logger.info("#app.dailyMessage: Guild %s, %s", guild, rows[i].guildid);
                        if (guild) {
                            channel = guild.channels.cache.get(rows[i].channelid);
                            logger.info("#app.dailyMessage: Channel %s", channel);

                            channel.send({embed: exampleEmbed});

                        } else logger.error("There's no guild with that ID.");
                    }
                }
            });
        }
    });
}

async function doGames(message) {
    var url = "https://portal.atheios.org/rest/games";

    rp({

        url: url,
        json: true
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            logger.info("Body %s", JSON.stringify(body)); // Print the json response
            logger.info("Nr games active %s", body.games.length);
            const exampleEmbed = {
                color: 0xffff,
                title: '**GARP powered games**',
                url: 'https://garp.io',
                author: {
                    name: 'GARP',
                    icon_url: 'https://garp.io/images/logo-default.png',
                    url: 'https://garp.io',
                },
                description: 'Active game list',
                thumbnail: {
                    url: 'https://garo.io/images/logo_default.png',
                },
                fields: [],
                timestamp: new Date(),
                footer: {
                    text: 'GARP tipbot',
                },
            };
            var gurl = "";
            for (var i = 0; i < body.games.length; i++) {
                if (body.games[i].url === "") {
                    gurl = "";
                } else {
                    gurl = ", [Link](" + body.games[i].url + ")";
                }
                exampleEmbed.fields[i] = {
                    name: body.games[i].name + gurl,
                    value: body.games[i].currentpayout + " ATH\n" + body.games[i].ethopayout + " ETHO\n",
                    inline: false
                }
            }
            message.channel.send({embed: exampleEmbed});
        }
    });
}


// Here we check if we shall roll over games
// Initialize long heartbeat every minute
let longIntervalId;

longIntervalId=setInterval(
    () => dailyMessage(),
    60000*720
);


function privateorSpamChannel(message, wrongchannelmsg, fn, args) {
    if (!inPrivateorSpamChannel(message)) {
        message.reply(wrongchannelmsg);
        return;
    }
    fn.apply(null, [message, ...args]);
}

function inPrivateorSpamChannel(msg) {
    if (msg.channel.type == 'dm') {
        return true;
    } else {
        return false;
    }
}




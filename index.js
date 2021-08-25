// References
const Discord = require("discord.js");
const DiscordEmbedPage = require("discord-paginationembed");
const request = require("request");
const config = require("./config.json");

// Discord Client
const Client = new Discord.Client();

// Native Dictionary Loading
var dictionary = {};
var mashedDictionary = [];

// Look into refreshing these data placeholders every few hours or so to keep the data somewhat updated real time.
request({url: config.url, json: true}, (error, response, body) => {
  if (!error && response.statusCode === 200) {
    dictionary = { natives: body, categories: Object.keys(body) }
    dictionary.categories.forEach(category => {
      Object.keys(dictionary.natives[category]).forEach((value, _) => {
        mashedDictionary.push(dictionary.natives[category][value]);
      })
    });
  }
})

// Discord Login
Client.login(config.token).catch((reason) => {
  console.log(`Login Error: ${reason}`);
})

// COMMANDS \\
Client.on("message", (data) => {
  if (!data.content.startsWith(config.prefix) || data.author.bot) return;
  const args = data.content.slice(config.prefix.length).split(/ +/);
  const command = args.shift().toLocaleLowerCase();
  data.delete(0);
  switch (command) {
    case "filter":
      if (args[0] == null) {
        data.channel.send("filter argument not found :filter {KEYWORD}").then(msg => {
          msg.delete(2500);
        })
        break;
      }
      FilterNatives(data, args[0]);
      break;
    case "findindex":
        if (args[0] == null) {
          data.channel.send("find argument not found :find {INDEX}").then(msg => {
            msg.delete(2500);
          })
          break;
        }
        if (isNaN(args[0])) {
          data.channel.send("find argument was not a valid integer").then(msg => {
            msg.delete(2500);
          })
        }
      FindNativeByIndex(data, Number(args[0]));
      break;
    case "findhash":
      if (args[0] == null) {
        data.channel.send("find argument not found :find {INDEX}").then(msg => {
          msg.delete(2500);
        })
        break;
      }
      FindNativeByHash(data, args[0]);
      break;
    default:
      data.channel.send("Invalid Command").then(msg => {
        msg.delete(1000);
      })
      break;
  }
})

// Find natives based on a single argument filter
function FilterNatives(data, keyword) {
  let foundResults = [];
  Object.keys(mashedDictionary).forEach((value, index) => {
    let nativeData = mashedDictionary[index];
    if (nativeData.name != null) {
      if (nativeData.name.includes(keyword.toUpperCase())) {
        foundResults.push({index, data: nativeData});
      }
    }
  })

  if (foundResults.length <= 0) {
    data.channel.send(`No natives found with that filter keyword: ${keyword.toUpperCase()}`).then(msg => {
      msg.delete(3000);
    })
    return;
  }

  // Paginated Object Arrays
  const embedDataArray = [];
  foundResults.forEach(result => {
    embedDataArray.push({ index: result.index, name: result.data.name, hash: result.data.hash });
  });

  // Message Embedded
  const FieldEmbed = new DiscordEmbedPage.FieldsEmbed()
  .setArray(embedDataArray)
  .setChannel(data.channel)
  .setElementsPerPage(10)
  .setPageIndicator(false)
  .formatField(`Native Results: ${keyword.toUpperCase()}`, el => `[${el.index}] - ${el.name}\n ${el.hash}\n`);
  FieldEmbed.embed.setColor("#0099ff");

  // Building Field
  FieldEmbed.build();
}

// Find native based on a single hash
function FindNativeByHash(data, hash) {
  // Finding Native by hash
  const native = mashedDictionary.find(native => {
    if (native.hash == hash) {
      return native;
    }
    return null;
  })

  // Safe checking native not returned by hash
  if (native == null || native == undefined) { 
    data.channel.send(`Native not found with the hash '${hash}'`).then(msg => {
      msg.delete(3000);
    })
    return;
  }

  // Param Builder
  let params = "";
  if (native.params.length > 0) {
    native.params.forEach(param => {
      params = params + `${param.type} ${param.name}\n- ${param.description || "N/A"}\n\n`
    });
  }
  
  // Embedded Result
  const embed = new Discord.RichEmbed()
  .setColor('#0099ff')
  .setTitle(native.hash)
  .addField("Name", native.name, true)
  .addBlankField(false)
  .addField("Parameters", params)
  .addBlankField(false)
  .addField("Result", native.results)
  .addField("Description", native.description || "N/A");

  // Sending Embed
  data.channel.send(embed);
}

// Find native based on a single index
function FindNativeByIndex(data, index) {
  // Finding Native by hash
  const native = mashedDictionary[index];

  // Safe checking native not returned by hash
  if (native == null || native == undefined) { 
    data.channel.send(`Native not found with the index '${index}'`).then(msg => {
      msg.delete(3000);
    })
    return;
  }
  
  // Param Builder
  let params = "";
  if (native.params.length > 0) {
    native.params.forEach(param => {
      params = params + `${param.type} ${param.name}\n- ${param.description || "N/A"}\n\n`
    });
  }

  // Embedded Result
  const embed = new Discord.RichEmbed()
  .setColor('#0099ff')
  .setTitle(native.hash)
  .addField("Name", native.name, true)
  .addBlankField(false)
  .addField("Parameters", params)
  .addBlankField(false)
  .addField("Result", native.results)
  .addField("Description", native.description || "N/A");

  // Sending Embed
  data.channel.send(embed);
}

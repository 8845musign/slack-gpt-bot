const OPEN_AI_KEY = PropertiesService.getScriptProperties().getProperty('OPEN_AI_KEY');
const SLACK_BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');

if (OPEN_AI_KEY === null) {
  throw new Error('OPEN_AI_KEY is not set');
}

if (SLACK_BOT_TOKEN === null) {
  throw new Error('SLACK_BOT_TOKEN is not set');
}

const app = SlackApp.create(SLACK_BOT_TOKEN);

function doPost(e) {
  Logger.log('-------- run --------');

  let postData;

  try {
    postData = JSON.parse(e.postData.getDataAsString());
  } catch (e) {
    Logger.log(e);
  }

  // url_verification
  try {
    if (postData.type == "url_verification") {
      return ContentService.createTextOutput(json.challenge);
    }
  }
  catch (ex) {
    Logger.log(ex);
  }

  try {
    const mentinoReg = /<@.*?>/;
    app.chatPostMessage(postData.event.channel, `${postData.event.text.replace(mentinoReg, '')}と言われた`);
  } catch (e) {
    Logger.log(e);
  }
}

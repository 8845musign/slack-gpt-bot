const OPEN_AI_KEY = PropertiesService.getScriptProperties().getProperty('OPEN_AI_KEY');
const SLACK_BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
const cache = CacheService.getScriptCache();

if (OPEN_AI_KEY === null) {
  throw new Error('OPEN_AI_KEY is not set');
}

if (SLACK_BOT_TOKEN === null) {
  throw new Error('SLACK_BOT_TOKEN is not set');
}

const app = SlackApp.create(SLACK_BOT_TOKEN);

function lockProcessByClientMsgId(client_msg_id) {
  // client_msg_idをキャッシュに追加
  cache.put(`process_${client_msg_id}`, client_msg_id, 60 * 5);
  Logger.log(`lock: ${client_msg_id}`);
}

function isProcessing(client_msg_id) {
  return cache.get(`process_${client_msg_id}`) !== null;
}

function unLockProcessByClientMsgId(client_msg_id) {
  cache.remove(`process_${client_msg_id}`);
  Logger.log(`unlock: ${client_msg_id}`);
}

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
  catch (e) {
    Logger.log(e);
  }

  const { text, client_msg_id } = postData.event;

  if (isProcessing(client_msg_id)) {
    return;
  }

  lockProcessByClientMsgId(client_msg_id);

  try {
    const mentinoReg = /<@.*?>/;
    app.chatPostMessage(postData.event.channel, `${text.replace(mentinoReg, '')}と言われた`);
  } catch (e) {
    Logger.log(e);
    unLockProcessByClientMsgId(client_msg_id);
  }
}

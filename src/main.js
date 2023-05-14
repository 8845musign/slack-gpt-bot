const OPEN_AI_KEY = PropertiesService.getScriptProperties().getProperty('OPEN_AI_KEY');
const OPEN_AI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const SLACK_BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
const cache = CacheService.getScriptCache();


if (OPEN_AI_KEY === null) {
  throw new Error('OPEN_AI_KEY is not set');
}

if (SLACK_BOT_TOKEN === null) {
  throw new Error('SLACK_BOT_TOKEN is not set');
}
// eslint-disable-next-line no-undef
const app = SlackApp.create(SLACK_BOT_TOKEN);

function lockProcessByClientMsgId(clientMsgId) {
  // clientMsgIdをキャッシュに追加
  cache.put(`process_${clientMsgId}`, clientMsgId, 60 * 5);
  Logger.log(`lock: ${clientMsgId}`);
}

function isProcessing(clientMsgId) {
  return cache.get(`process_${clientMsgId}`) !== null;
}

function unLockProcessByClientMsgId(clientMsgId) {
  cache.remove(`process_${clientMsgId}`);
  Logger.log(`unlock: ${clientMsgId}`);
}

// eslint-disable-next-line no-unused-vars
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
    if (postData.type === "url_verification") {
      return ContentService.createTextOutput(postData.challenge);
    }
  }
  catch (e) {
    Logger.log(e);
  }

  // eslint-disable-next-line camelcase
  const { text, client_msg_id } = postData.event;

  if (isProcessing(client_msg_id)) {
    return;
  }

  lockProcessByClientMsgId(client_msg_id);

  try {
    const mentinoReg = /<@.*?>/;
    const relayMessage = talkWithGPT(text.replace(mentinoReg, ''));
    app.chatPostMessage(postData.event.channel, relayMessage);
  } catch (e) {
    app.chatPostMessage(postData.event.channel, `ごめんなさい、エラーでお答えできませんでした。。。`);
    Logger.log(e);
    unLockProcessByClientMsgId(client_msg_id);
  }
}

const talkWithGPT = (messages) => {
  const requestBody = {
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'user',
      content: messages
    }],
    max_tokens: 1000,
    temperature: 0.5
  }

  const res = UrlFetchApp.fetch(OPEN_AI_ENDPOINT, {
    method: 'post',
    headers: {
      Authorization: `Bearer ${OPEN_AI_KEY}`,
      Accept: 'application/json',
    },
    contentType: 'application/json',
    payload: JSON.stringify(requestBody)
  });

  if (res.getResponseCode() !== 200) {
    throw new Error(res.getContentText());
  }

  const replay = JSON.parse(res.getContentText());

  return replay.choices[0].message.content;
}
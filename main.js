const Eris = require('eris'),
	Githubhook = require('githubhook');

var bot = new Eris('TOKEN_HERE', {
		autoReconnect: true,
		disableEveryone: true,
		messageLimit: 10,
		sequencerWait: 100,
		disableEvents: {
			"CHANNEL_CREATE": true,
			"CHANNEL_DELETE": true,
			"CHANNEL_UPDATE": true,
			"GUILD_BAN_ADD": true,
			"GUILD_BAN_REMOVE": true,
			"GUILD_CREATE": true,
			"GUILD_DELETE": true,
			"GUILD_MEMBER_ADD": true,
			"GUILD_MEMBER_REMOVE": true,
			"GUILD_MEMBER_UPDATE": true,
			"GUILD_ROLE_CREATE": true,
			"GUILD_ROLE_DELETE": true,
			"GUILD_ROLE_UPDATE": true,
			"GUILD_UPDATE": true,
			"MESSAGE_CREATE": true,
			"MESSAGE_DELETE": true,
			"MESSAGE_DELETE_BULK": true,
			"MESSAGE_UPDATE": true,
			"PRESENCE_UPDATE": true,
			"TYPING_START": true,
			"USER_UPDATE": true,
			"VOICE_STATE_UPDATE": true
		}
	}),
	github = new Githubhook({"port": 4567, "secret": "SECRET_HERE"});

bot.connect().catch(console.error);
bot.on('ready', () => {
	console.log("Connected to Discord");
	github.listen();
});
bot.on('disconnected', () => {
	console.log("Disconnected from Discord");
});
bot.on('error', e => {
	console.log(`Error: ${e}\n${e.stack}`);
});

function sendEvent(repo, text) {
	bot.createMessage('CHANNEL_ID', `${repo}: ${text}`.substr(0, 2000));
}

github.on('ping', (_repo, _ref, data) => {
	bot.createMessage('CHANNEL_ID', `**Ping event recieved**\n${data.zen}`);
});

github.on('commit_comment', (_repo, _ref, data) => {
	sendEvent(data.repository.full_name, `**${data.comment.user.login}** ${data.action} a comment on **${data.comment.commit_id.substr(0, 7)}**\n${data.comment.body}`);
});

github.on('create', (_repo, _ref, data) => {
	sendEvent(data.repository.full_name, `**${data.sender.login} created ${data.ref_type} ${data.ref}**`);
});

github.on('delete', (_repo, _ref, data) => {
	sendEvent(data.repository.full_name, `**${data.sender.login} deleted ${data.ref_type} ${data.ref}**`);
});

github.on('fork', (_repo, _ref, data) => {
	sendEvent(data.repository.full_name, `**${data.forkee.owner.login}** forked this repository`);
});

github.on('gollum', (_repo, _ref, data) => {
	let toSend = [`**Wiki updated by ${data.sender.login}**`];
	data.pages.forEach(p => {
		toSend.push(` \`${p.action}\` ${p.title}`);
	});
	sendEvent(data.repository.full_name, toSend.join('\n'));
});

github.on('issue_comment', (_repo, _ref, data) => {
	sendEvent(data.repository.full_name, `**${data.sender.login}** ${data.action} a comment on issue #${data.issue.number}:\n **${data.issue.title}**\n${data.comment.body}`);
});

github.on('issues', (_repo, _ref, data) => {
	switch (data.action) {
		case 'opened':
			sendEvent(data.repository.full_name, `**${data.issue.user.login}** opened issue #${data.issue.number}:\n **${data.issue.title}**\n${data.issue.body}`);
			break;
		case 'reopened': {
			let labels = data.issue.labels.map(i => `\`[${i.name}]\``).join(' ');
			sendEvent(data.repository.full_name, `**${data.sender.login}** re-opened issue #${data.issue.number}:\n **${data.issue.title}** ${labels}`);
			break;
		} case 'closed': {
			let labels = data.issue.labels.map(i => `\`[${i.name}]\``).join(' ');
			sendEvent(data.repository.full_name, `**${data.sender.login}** closed issue #${data.issue.number}:\n **${data.issue.title}** ${labels}`);
			break;
		} case 'labeled':
			sendEvent(data.repository.full_name, `**${data.sender.login}** added label \`[${data.label.name}]\` to issue #${data.issue.number}:\n **${data.issue.title}**`);
			break;
		case 'unlabeled': {
			sendEvent(data.repository.full_name, `**${data.sender.login}** removed label \`[${data.label.name}]\` from issue #${data.issue.number}:\n **${data.issue.title}**`);
			break;
		}
	}
});

github.on('membership', (_repo, _ref, data) => {
	sendEvent(data.repository.full_name, `**${data.member.login} was ${data.action} to this repository** by ${data.sender.login}`);
});

github.on('pull_request', (_repo, _ref, data) => {
	switch (data.action) {
		case 'opened':
			sendEvent(data.repository.full_name, `**${data.pull_request.user.login}** opened pull request #${data.pull_request.number}:\n **${data.pull_request.title}**\n${data.pull_request.body}`);
			break;
		case 'reopened':
			sendEvent(data.repository.full_name, `**${data.sender.login}** re-opened pull request #${data.pull_request.number}:\n **${data.pull_request.title}**`);
			break;
		case 'closed':
			sendEvent(data.repository.full_name, `**${data.sender.login}** ${data.pull_request.merged ? 'merged' : 'closed'} pull request #${data.pull_request.number}:\n **${data.pull_request.title}**`);
			break;
		case 'edited':
			sendEvent(data.repository.full_name, `**${data.sender.login}** edited pull request #${data.pull_request.number}:\n **${data.pull_request.title}**\n${data.pull_request.body}`);
			break;
		case 'labeled':
			sendEvent(data.repository.full_name, `**${data.sender.login}** added label \`[${data.label.name}]\` to pull request #${data.pull_request.number}:\n **${data.pull_request.title}**`);
			break;
		case 'unlabeled':
			sendEvent(data.repository.full_name, `**${data.sender.login}** removed label \`[${data.label.name}]\` from pull request #${data.pull_request.number}:\n **${data.pull_request.title}**`);
			break;
		case 'syncronize':
			sendEvent(data.repository.full_name, `**${data.pull_request.user.login}** added commits to pull request #${data.pull_request.number}:\n **${data.pull_request.title}**`);
			break;
	}
});

github.on('pull_request_review_comment', (_repo, _ref, data) => {
	sendEvent(data.repository.full_name, `**${data.sender.login}** ${data.action} a comment at line ${data.comment.position} on pull request #${data.pull_request.number}:\n **${data.pull_request.title}**\n${data.comment.body}`);
});

github.on('push', (_repo, ref, data) => {
	if (ref.split('/')[1] === 'heads')
		sendEvent(data.repository.full_name, `**${data.sender.login} pushed ${data.commits.length} commit${data.commits.length === 1 ? '' : 's'} to ${ref.split('/')[2]}**${data.commits.map(c => `\n \`${c.id.substr(0, 7)}\` ${c.message.split('\n')[0]} (${c.author.username})`).join('')}`);
});

github.on('release', (_repo, _ref, data) => {
	if (data.release.draft === false)
		sendEvent(data.repository.full_name, `**${data.release.author.login} ${data.action} a release from ${data.release.commitish}**\nTitle: ${data.release.name || data.release.tag_name}${data.release.body ? '\n' + data.release.body : ''}`);
});

github.on('watch', (_repo, _ref, data) => {
	sendEvent(data.repository.full_name, `**${data.sender.login}** starred this repository`);
});
